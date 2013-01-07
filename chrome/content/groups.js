if (typeof com == "undefined") {
    var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

com.sppad.booky.Groups = new function() {

    var self = this;

    this.bookmarkInfoMap = new com.sppad.booky.Map();
    this.groupIdMap = new com.sppad.booky.Map();
    this.primaryIdCounts = new com.sppad.booky.Map();
    this.bookmarkIdToPrimaryId = new com.sppad.booky.Map();

    /**
     * Gets the launcher ID for a given tab. Currently this is based off the
     * hostname only.
     * 
     * @param aTab
     *            A browser tab
     * @return The id for the launcher for aTab
     */
    this.getPrimaryIdFromTab = function(aTab) {
        let currentUri = gBrowser.getBrowserForTab(aTab).currentURI;

        try {
            return this.getPrimaryIdFromUri(currentUri);
        } catch (err) {
            return aTab.label;
        }
    };

    /**
     * Gets the launcher ID for a given URI. Currently this is based off the
     * hostname only.
     * 
     * @param uriString
     *            A string representing a URI
     * @return The id for the launcher for uriString
     */
    this.getPrimaryIdFromUriString = function(uriString) {
        try {
            return Services.io.newURI(uriString, null, null).host || uriString;
        } catch (err) {
            return uriString;
        }
    };

    this.getPrimaryIdFromUri = function(aUri) {
        try {
            return aUri.host || aUri.asciiSpec;
        } catch (err) {
            return aUri.asciiSpec;
        }
    };
    
    this.getIdFromBookmarkNode = function(aNode) {
        return com.sppad.booky.Bookmarks.getRootFolderChildNodeId(
                aNode.itemId, aNode.parent.itemId);
    };

    return {

        getIdFromTab : function(aTab) {
            let primaryId = self.getPrimaryIdFromTab(aTab);
            return self.groupIdMap.get(primaryId);
        },

        getIdFromUriString : function(aUriString) {
            let primaryId = self.getPrimaryIdFromUriString(aUriString);
            return self.groupIdMap.get(primaryId);
        },

        handleEvent : function(aEvent) {
            switch (aEvent.type) {
                // case com.sppad.booky.Bookmarks.EVENT_ADD_FOLDER:
                // case com.sppad.booky.Bookmarks.EVENT_LOAD_FOLDER:
                // return this.onFolderAdded(aEvent);
//                case com.sppad.booky.Bookmarks.EVENT_MOV_FOLDER:
//                    return this.onMove(aEvent);
                    // case com.sppad.booky.Bookmarks.EVENT_DEL_FOLDER:
                    // return this.onFolderRemoved(aEvent);
                case com.sppad.booky.Bookmarks.EVENT_ADD_BOOKMARK:
                case com.sppad.booky.Bookmarks.EVENT_LOAD_BOOKMARK:
                    return this.onBookmarkAdded(aEvent);
                case com.sppad.booky.Bookmarks.EVENT_MOV_BOOKMARK:
                    return this.onBookmarkMoved(aEvent);
                case com.sppad.booky.Bookmarks.EVENT_DEL_BOOKMARK:
                    return this.onBookmarkRemoved(aEvent);
                default:
                    return null;
            }
        },
        
        moveToCorrectFolder: function(node) {
            let primaryId = self.getPrimaryIdFromUriString(node.uri);
            let folderId = self.groupIdMap.get(primaryId);
            
            if(!folderId)
                folderId = com.sppad.booky.Bookmarks.createFolder("", 0);
            
            com.sppad.booky.Bookmarks.moveBefore(null, node.itemId, folderId);
        },

        onBookmarkAdded: function(event) {
            
            dump("onBookmarkAdded\n");
            
            let node = event.node;
            let parentId = com.sppad.booky.Bookmarks.getFolder(node.itemId);
            let grandparentId = com.sppad.booky.Bookmarks.getFolder(parentId);
            
            if(com.sppad.booky.Bookmarks.isQuickLaunchFolder(parentId)) {
                this.moveToCorrectFolder(node);
                return;
            }
            

            if(!grandparentId || !com.sppad.booky.Bookmarks.isQuickLaunchFolder(grandparentId))
                return;
            
            let primaryId = self.getPrimaryIdFromUriString(node.uri);
            let folderId = self.groupIdMap.get(primaryId);
            
            if(folderId && parentId != folderId) {
                dump("alread have a folder, but it is not this one! FIX ME\n");
            }
            
            dump("Correct level bookmark added.\n");
            let bookmarkInfo = {
                    'parentId' : parentId,
                    'primaryId' : primaryId,
            };
            
            let count = self.primaryIdCounts.get(primaryId, 0) + 1;
            dump("count " + primaryId + " is: " + count + "\n");
            self.primaryIdCounts.put(primaryId, count);
            self.groupIdMap.put(primaryId, parentId);
            self.bookmarkInfoMap.put(node.itemId, bookmarkInfo);


            dump("adding " + node.uri + " to launcher " + folderId + "\n");
//            
//            let title = launcherId == primaryId ? primaryId : com.sppad.booky.Bookmarks.getTitle(launcherId);
            let launcher = com.sppad.booky.Launcher.getLauncher(parentId);
            launcher.addBookmark(node.uri, node.icon, node.itemId);
//            launcher.setTitle(title);
////            
////            // Add all existing tabs in the launcher
////            let tabs = gBrowser.tabs;
////            for(let i=0; i<tabs.length; i++)
////                if(groupId == com.sppad.booky.Groups.getIdFromTab(tabs[i]))
////                    launcher.addTab(tabs[i]);
////            
            com.sppad.booky.Booky.updateBookmarksCount(1);
            com.sppad.booky.Resizer.onResize();
        },

        onBookmarkRemoved: function(event) {
            
            dump("onBookmarkRemoved\n");
            let node = event.node;
            
            let info = self.bookmarkInfoMap.get(node.itemId);
            if(!info)
                return;
            
            let parentId = info.parentId;
            let primaryId = info.primaryId;
            
            dump("doing remove for " + node.itemId + " with primaryId " + primaryId + "\n");
            self.bookmarkInfoMap.remove(node.itemId);
            
            let count = self.primaryIdCounts.get(primaryId, 0) - 1;
            dump("count " + primaryId + " is: " + count + "\n");
            if(count > 0) {
                dump("decreased count for " + primaryId + "\n");
                self.primaryIdCounts.put(primaryId, count);
            } else {
                dump("removed count for " + primaryId + "\n");
                self.primaryIdCounts.remove(primaryId);  
                self.groupIdMap.remove(primaryId);
            }
            
            let launcher = com.sppad.booky.Launcher.getLauncher(parentId);
            launcher.removeBookmark(node.itemId);
            
            com.sppad.booky.Booky.updateBookmarksCount(-1);
            com.sppad.booky.Resizer.onResize();
        },

        onBookmarkMoved: function(event) {
            
            this.onBookmarkRemoved(event);
            this.onBookmarkAdded(event);


//            dump("onbookmark moved\n");
//
//            let node = event.node;
//            let nodeNext = event.nodeNext;
//            
//            let groupId = self.getIdFromBookmarkNode(node);
//
//            dump("Move: groupId is " + groupId + "\n");
//                     
//            let group = com.sppad.booky.Launcher.getLauncher(groupId);
//            let nextGroup = null;
//            
//            if(nodeNext) {
//                nextGroupId = self.getIdFromBookmarkNode(nodeNext);
//                nextGroup = com.sppad.booky.Launcher.getLauncher(nextGroupId);
//                
//                dump("Next groupId is " + nextGroupId + "\n");
//            }
//                     
//            group.createBefore(nextGroup);
//                     
//            // Force resize so things are hidden / shown appropriately.
//            com.sppad.booky.Resizer.onResize();
        },
        
        addFolder : function(aFolderID, aBookmarkArray) {

        },

        removeFolder : function(aFolderID) {

        },

        setup : function() {
            com.sppad.booky.Bookmarks.addListener(this);

        },

        cleanup : function() {
            com.sppad.booky.Bookmarks.removeListener(this);
        },
    }
};