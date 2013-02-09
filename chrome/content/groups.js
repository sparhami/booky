if (typeof com == "undefined") {
    var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

com.sppad.booky.Groups = new function() {

    var self = this;

    this.bookmarkInfoMap = new com.sppad.collections.Map();
    this.groupIdMap = new com.sppad.collections.Map();
    this.primaryIdCounts = new com.sppad.collections.Map();
    this.bookmarkIdToPrimaryId = new com.sppad.collections.Map();

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

        getHostFromUriString : function(aUriString) {
            return self.getPrimaryIdFromUriString(aUriString);
        },
        
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
                case com.sppad.booky.Bookmarks.EVENT_UPDATE_TITLE:
                    return this.onTitleUpdated(aEvent);
                default:
                    return null;
            }
        },
        
        /**
         * Moves a bookmark item to the correct launcher folder for that item.
         * If none exists, a new folder is created and the bookmark is moved
         * there.
         * 
         * @param aItemId
         *            A bookmark itemId
         * @param aUri
         *            A string representing the URI of the bookmark
         */
        moveToCorrectFolder: function(aItemId, aUriString) {
            let primaryId = self.getPrimaryIdFromUriString(aUriString);
            let folderId = self.groupIdMap.get(primaryId);
            
            if(!folderId)
                folderId = com.sppad.booky.Bookmarks.createFolder("");
            
            com.sppad.booky.Bookmarks.moveBefore(null, aItemId, folderId);
        },

        /**
         * Handles a bookmark being added.
         * <p>
         * For tracked bookmarks, the parentId will correspond to a sub-folder
         * of the quick launch bookmarks folder. This also acts as the group's
         * id.
         */
        onBookmarkAdded: function(aEvent) {
            
            let itemId = aEvent.itemId;
            let parentId = com.sppad.booky.Bookmarks.getFolder(itemId);
            let grandparentId = com.sppad.booky.Bookmarks.getFolder(parentId);
            
            // Check if bookmark is directly under the quick launch folder and
            // move it to the appropriate sub-folder if so. The bookmark move
            // event will end up calling us again once the bookmark is in the
            // right location.
            if(com.sppad.booky.Bookmarks.isQuickLaunchFolder(parentId)) {
                this.moveToCorrectFolder(itemId, aEvent.uri);
                return;
            }

            // Not in a launcher folder, so nothing to do
            if(!com.sppad.booky.Bookmarks.isQuickLaunchFolder(grandparentId))
                return;
            
            let primaryId = self.getPrimaryIdFromUriString(aEvent.uri);
            let prevFolderId = self.groupIdMap.get(primaryId);
            
            // Used to track the parent folder. Needed for when a bookmark is
            // deleted so we know which launcher it came from.
            let bookmarkInfo = {
                    'parentId' : parentId,
                    'primaryId' : primaryId,
            };

            // Update how many bookmark URIs we are tracking that correspond to
            // this site. Needed so that we can know when to remove the mapping
            // between URI and group id.
            let count = self.primaryIdCounts.get(primaryId, 0) + 1;
            self.primaryIdCounts.put(primaryId, count);
            
            self.groupIdMap.put(primaryId, parentId);
            self.bookmarkInfoMap.put(itemId, bookmarkInfo);

            let launcher = com.sppad.booky.Launcher.getLauncher(parentId);
            launcher.setBookmarks(com.sppad.booky.Bookmarks.getBookmarks(parentId));
             
            // Get all tabs in the same domain
            let tabs = gBrowser.tabs;
            let sameDomainTabs = new Array();
            for(let i=0; i<tabs.length; i++)
                if(primaryId == self.getPrimaryIdFromTab(tabs[i]))
                    sameDomainTabs.push(tabs[i]);

            // Handle moving betweem two launchers. Moves all bookmarks with the
            // same host from the old launcher to the new one.
            if((prevFolderId != undefined) && (parentId != prevFolderId)) {
                let previousLauncher = com.sppad.booky.Launcher.getLauncher(prevFolderId);
                let otherbookmarks = com.sppad.booky.Bookmarks.getBookmarks(prevFolderId);
                
                // Old launcher should no longer track the tabs
                for(let i=0; i<sameDomainTabs.length; i++)
                    previousLauncher.removeTab(sameDomainTabs[i]);
                
                // Grab all the bookmarks with the same domain and move them
                for(let i=0; i<otherbookmarks.length; i++) {
                    let bookmark = otherbookmarks[i];
                    let domain = self.getPrimaryIdFromUriString(bookmark.uri);
                    
                    // Need to update the bookmarkInfo object for this bookmark
                    // since the parent folder has changed
                    if(domain == primaryId) {
                        self.bookmarkInfoMap.put(bookmark.itemId, bookmarkInfo);
                        com.sppad.booky.Bookmarks.moveBefore(null, bookmark.itemId, parentId);
                    }
               }
                
                previousLauncher.setBookmarks(com.sppad.booky.Bookmarks.getBookmarks(prevFolderId));
            }
            
            // Add the tabs to the launcher if it is either new or the domain is
            // changing to a new launcher
            if(!prevFolderId || movingLaunchers)
                for(let i=0; i<sameDomainTabs.length; i++)
                    launcher.addTab(sameDomainTabs[i]);
            
            com.sppad.booky.Resizer.onResize();
        },

        /**
         * Handles a bookmark being removed. This is called after the bookmark
         * has already been removed, so we need to lookup which launcher the
         * bookmark belonged to.
         */
        onBookmarkRemoved: function(aEvent) {
           
            let itemId = aEvent.itemId;
            let info = self.bookmarkInfoMap.get(itemId);
            
            // Not a tracked bookmark, nothing to do
            if(!info)
                return;
            
            let parentId = info.parentId;
            let primaryId = info.primaryId;
            
            // Update how many bookmarks map to the launcher
            let count = self.primaryIdCounts.get(primaryId, 0) - 1;
            if(count > 0) {
                self.primaryIdCounts.put(primaryId, count);
            } else {
                self.primaryIdCounts.remove(primaryId);  
                self.groupIdMap.remove(primaryId);
            }
            
            self.bookmarkInfoMap.remove(itemId);
            
            // Update the launcher, if it still exists
            let launcher = com.sppad.booky.Launcher.getLauncher(parentId);
            if(launcher) {
                launcher.setBookmarks(com.sppad.booky.Bookmarks.getBookmarks(parentId));
                launcher.updateAttributes();
            }
            
            com.sppad.booky.Resizer.onResize();
        },

        /**
         * Handles a bookmark move event. Note that a move can be within the
         * quick launch folder or from another bookmark folder entirely.
         */
        onBookmarkMoved: function(aEvent) {
            
            let itemId = aEvent.itemId;
            let parentId = com.sppad.booky.Bookmarks.getFolder(itemId);
            let info = self.bookmarkInfoMap.get(itemId);
            
            // Moving within a launcher. update bookmarks for ordering
            if(info && parentId == info.parentId) {
                let launcher = com.sppad.booky.Launcher.getLauncher(parentId);
                launcher.setBookmarks(com.sppad.booky.Bookmarks.getBookmarks(parentId));
            // onBookmarkAdded handles bookmarks that are new and those that
            // moving between groups
            } else {
                this.onBookmarkAdded(aEvent);
            }
        },
        
        /**
         * Handles a folder being added. Folders correspond to launchers if they
         * are direct sub folders of the quick launch folder.
         */
        onFolderAdded: function(aEvent) {
            
            let itemId = aEvent.itemId;
            let nextItemId = aEvent.nextItemId;
            let parentId = com.sppad.booky.Bookmarks.getFolder(itemId);
            
            // Not a direct subfolder, so nothing to do
            if(!com.sppad.booky.Bookmarks.isQuickLaunchFolder(parentId))
                return;
            
            let bookmarkInfo = { 'parentId' : parentId, };
            self.bookmarkInfoMap.put(itemId, bookmarkInfo);

            let launcher = com.sppad.booky.Launcher.createLauncher(itemId);

            com.sppad.booky.Bookmarks.loadFolder(itemId);
            launcher.setTitle(aEvent.title);
            launcher.createBefore(nextItemId);
            
            com.sppad.booky.Booky.updateLauncherCount(1);
            com.sppad.booky.Resizer.onResize();
        },
        
        /**
         * Handles folders being removed. Only care about launcher folders.
         */
        onFolderRemoved: function(aEvent) {
            
            let itemId = aEvent.itemId;
            let info = self.bookmarkInfoMap.get(itemId);
            
            // Not a direct subfolder, so nothing to do
            if(!info)
                return;
            
            self.bookmarkInfoMap.remove(itemId);
            
            let launcher = com.sppad.booky.Launcher.getLauncher(itemId);
            launcher.removeLauncher();
            
            com.sppad.booky.Booky.updateLauncherCount(-1);
            com.sppad.booky.Resizer.onResize();
        },
        
        /**
         * Handles folders being moved. Only care about launcher folders.
         */
        onFolderMoved: function(aEvent) {
            
            let itemId = aEvent.itemId;
            let nextItemId = aEvent.nextItemId;
            let parentId = com.sppad.booky.Bookmarks.getFolder(itemId);
            let info = self.bookmarkInfoMap.get(itemId);
            
            // Launcher folder is being reordered with siblings
            if(info && parentId == info.parentId) {
                let launcher = com.sppad.booky.Launcher.getLauncher(itemId);
                launcher.createBefore(nextItemId);
                
                com.sppad.booky.Resizer.onResize();
            // Folder is moving in/out or has nothing to do with the quick
            // launch folder
            } else {
                this.onFolderRemoved(aEvent);
                this.onFolderAdded(aEvent);
            }
        },

        onTitleUpdated: function(aEvent) {
            let itemId = aEvent.itemId;
            let parentId = com.sppad.booky.Bookmarks.getFolder(itemId);
            
            // Not a launcher, so nothing to do
            if(!com.sppad.booky.Bookmarks.isQuickLaunchFolder(parentId))
                return;
            
            let launcher = com.sppad.booky.Launcher.getLauncher(itemId);
            launcher.setTitle(aEvent.title);
        },
        
        setup : function() {
            com.sppad.booky.Bookmarks.addListener(this);
            
            com.sppad.booky.Booky.updateLauncherCount(0);
            com.sppad.booky.Bookmarks.loadBookmarks();
        },

        cleanup : function() {
            com.sppad.booky.Bookmarks.removeListener(this);
        },
    }
};