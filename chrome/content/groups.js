if (typeof com == "undefined") {
    var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

com.sppad.booky.Groups = new function() {

    var self = this;

    this.groupIdMap = new com.sppad.booky.Map();

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
                case com.sppad.booky.Bookmarks.EVENT_MOV_FOLDER:
                    return this.onMove(aEvent);
                    // case com.sppad.booky.Bookmarks.EVENT_DEL_FOLDER:
                    // return this.onFolderRemoved(aEvent);
                case com.sppad.booky.Bookmarks.EVENT_ADD_BOOKMARK:
                case com.sppad.booky.Bookmarks.EVENT_LOAD_BOOKMARK:
                    return this.onBookmarkAdded(aEvent);
                case com.sppad.booky.Bookmarks.EVENT_MOV_BOOKMARK:
                    return this.onMove(aEvent);
                case com.sppad.booky.Bookmarks.EVENT_DEL_BOOKMARK:
                    return this.onBookmarkRemoved(aEvent);
                default:
                    return null;
            }
        },

        onBookmarkAdded : function(event) {
            
            let node = event.node;
            let primaryId = self.getPrimaryIdFromUriString(node.uri);
            let launcherId = self.groupIdMap.get(primaryId);
            let containerId = com.sppad.booky.Bookmarks.getRootFolderChildNodeId(node.itemId);
            
            if(launcherId) {
                dump("have launcherId\n");
            } else if(containerId != node.itemId) {
                dump("parent is ok\n");
                
                launcherId = containerId;
                self.groupIdMap.put(primaryId, launcherId);
                dump("Mapping " + primaryId + " to " +  launcherId + "\n");
            } else {
                dump("making folder\n");
                launcherId = com.sppad.booky.Bookmarks.createFolder("New Folder", node.bookmarkIndex);
     
                dump("Mapping " + primaryId + " to " +  launcherId + "\n");
                
                com.sppad.booky.Bookmarks.moveBefore(null, node.itemId, launcherId);
            }
            
            
//            let node = event.node;
//
//            let groupId = self.getIdFromBookmarkNode(node);
//            let primaryId = self.getPrimaryIdFromUriString(node.uri);

//            
//            dump("Mapping " + primaryId + " to " + groupId + "\n");
//            self.groupIdMap.put(primaryId, groupId);
//            
            
            let title = com.sppad.booky.Bookmarks.getTitle(launcherId) || node.uri;
            let launcher = com.sppad.booky.Launcher.getLauncher(launcherId);
            launcher.addBookmark(node.uri, node.icon, node.itemId);
            launcher.setTitle(title);
//            
//            // Add all existing tabs in the launcher
//            let tabs = gBrowser.tabs;
//            for(let i=0; i<tabs.length; i++)
//                if(groupId == com.sppad.booky.Groups.getIdFromTab(tabs[i]))
//                    launcher.addTab(tabs[i]);
//            
            com.sppad.booky.Booky.updateBookmarksCount(1);
//            com.sppad.booky.Resizer.onResize();
        },

        onBookmarkRemoved : function(event) {
            
            let node = event.node;
            let launcher = com.sppad.booky.Launcher.getLauncherFromBookmarkId(node.itemId);
          
            // Can occur due to how bookmarks are edited (at least on Linux)
            if(!launcher)
                 return;
               
            launcher.removeBookmark(node.itemId);
            com.sppad.booky.Booky.updateBookmarksCount(-1); 
            
//            dump("onbookmark moved\n");
//            let node = event.node;
//            let primaryId = self.getPrimaryIdFromUriString(node.uri);
//
//            let groupId = self.groupIdMap.remove(primaryId);
//            dump("Removing Mapping " + primaryId + " to " + groupId + "\n");
//            
//            let node = event.node;
//            // Need to lookup by the bookmark id because the uri of the boomark
//            // may have changed (if it has been modified at not deleted).
//            let launcher = com.sppad.booky.Launcher.getLauncherFromBookmarkId(node.itemId);
//       
//            // Can occur due to how bookmarks are edited (at least on Linux)
//            if(!launcher)
//                return;
//            
//            launcher.removeBookmark(node.itemId);
//            
//            com.sppad.booky.Booky.updateBookmarksCount(-1);
//            com.sppad.booky.Resizer.onResize();
        },

        onMove : function(event) {

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