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
                case com.sppad.booky.Bookmarks.EVENT_ADD_FOLDER:
                case com.sppad.booky.Bookmarks.EVENT_LOAD_FOLDER:
                    return this.onFolderAdded(aEvent);
                case com.sppad.booky.Bookmarks.EVENT_MOV_FOLDER:
                    return this.onFolderMoved(aEvent);
                case com.sppad.booky.Bookmarks.EVENT_DEL_FOLDER:
                    return this.onFolderRemoved(aEvent);
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
            
            // dump("onBookmarkAdded\n");
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
            
            let bookmarkInfo = {
                    'parentId' : parentId,
                    'primaryId' : primaryId,
            };
            
            let count = self.primaryIdCounts.get(primaryId, 0) + 1;
            self.primaryIdCounts.put(primaryId, count);
            self.groupIdMap.put(primaryId, parentId);
            self.bookmarkInfoMap.put(node.itemId, bookmarkInfo);

            dump("adding " + node.uri + " to launcher " + folderId + "\n");
            // let title = launcherId == primaryId ? primaryId :
            // com.sppad.booky.Bookmarks.getTitle(launcherId);
            let launcher = com.sppad.booky.Launcher.getLauncher(parentId);
            //launcher.addBookmark(node.uri, node.icon, node.itemId);
            launcher.setBookmarks(com.sppad.booky.Bookmarks.getBookmarks(parentId));
//             launcher.setTitle(title);
             
              // Add all existing tabs in the launcher
            let tabs = gBrowser.tabs;
            for(let i=0; i<tabs.length; i++)
                if(primaryId == self.getPrimaryIdFromTab(tabs[i]))
                    launcher.addTab(tabs[i]);
             
            com.sppad.booky.Resizer.onResize();
        },

        onBookmarkRemoved: function(event) {
            
            // dump("onBookmarkRemoved\n");
            let node = event.node;
            let info = self.bookmarkInfoMap.get(node.itemId);
            if(!info)
                return;
            
            let parentId = info.parentId;
            let primaryId = info.primaryId;
            
            let count = self.primaryIdCounts.get(primaryId, 0) - 1;
            if(count > 0) {
                self.primaryIdCounts.put(primaryId, count);
            } else {
                self.primaryIdCounts.remove(primaryId);  
                self.groupIdMap.remove(primaryId);
            }
            
            self.bookmarkInfoMap.remove(node.itemId);
            
            let launcher = com.sppad.booky.Launcher.getLauncher(parentId);
//            if(launcher)
//                launcher.removeBookmark(node.itemId);
            if(launcher)
                launcher.setBookmarks(com.sppad.booky.Bookmarks.getBookmarks(parentId, node.itemId));
            
            com.sppad.booky.Resizer.onResize();
        },

        onBookmarkMoved: function(event) {
            
            let node = event.node;
            let parentId = com.sppad.booky.Bookmarks.getFolder(node.itemId);
            let info = self.bookmarkInfoMap.get(node.itemId);
            if(info && parentId == info.parentId) {
                let launcher = com.sppad.booky.Launcher.getLauncher(parentId);
                launcher.setBookmarks(com.sppad.booky.Bookmarks.getBookmarks(parentId));
            } else {
                this.onBookmarkRemoved(event);
                this.onBookmarkAdded(event);
            }
        },
        
        onFolderAdded: function(event) {
            
            let node = event.node ;
            let parentId = com.sppad.booky.Bookmarks.getFolder(node.itemId);
            
            if(!parentId || !com.sppad.booky.Bookmarks.isQuickLaunchFolder(parentId))
                return;
            
            let bookmarkInfo = { 'parentId' : parentId, };
            self.bookmarkInfoMap.put(node.itemId, bookmarkInfo);
            
            let launcher = com.sppad.booky.Launcher.createLauncher(node.itemId);
            com.sppad.booky.Bookmarks.loadFolder(node.itemId);
            
            com.sppad.booky.Booky.updateBookmarksCount(1);
        },
        
        onFolderRemoved: function(event) {
            
            let node = event.node ;
            let info = self.bookmarkInfoMap.get(node.itemId);
            if(!info)
                return;
            
            self.bookmarkInfoMap.remove(node.itemId);
            
            let launcher = com.sppad.booky.Launcher.getLauncher(node.itemId);
            launcher.removeLauncher();
            
            com.sppad.booky.Booky.updateBookmarksCount(-1);
        },
        
        onFolderMoved: function(event) {
            
            let node = event.node;
            let nodeNext = event.nodeNext;
            let parentId = com.sppad.booky.Bookmarks.getFolder(node.itemId);
            let info = self.bookmarkInfoMap.get(node.itemId);
            if(info && parentId == info.parentId) {
                
                let launcher = com.sppad.booky.Launcher.getLauncher(node.itemId);
                launcher.createBefore(nodeNext ? nodeNext.itemId : null);
                
                com.sppad.booky.Resizer.onResize();
            } else {
                this.onFolderRemoved(event);
                this.onFolderAdded(event);
            }
            
        },

        setup : function() {
            com.sppad.booky.Bookmarks.addListener(this);
            
            com.sppad.booky.Booky.updateBookmarksCount(0);
            com.sppad.booky.Bookmarks.loadBookmarks();
        },

        cleanup : function() {
            com.sppad.booky.Bookmarks.removeListener(this);
        },
    }
};