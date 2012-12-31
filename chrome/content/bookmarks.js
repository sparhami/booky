if (typeof com == "undefined") {
  var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');

// An nsINavBookmarkObserver
com.sppad.booky.BookmarksListener = {
        
	onBeginUpdateBatch: function() {},
	onEndUpdateBatch: function() {},
	
	onItemAdded: function(aItemId, aFolder, aIndex) {
	    
	    dump("item added\n");
	    let rootChildId = com.sppad.booky.Bookmarks.getRootFolderChildNodeId(aItemId, aFolder);
	    
		if(rootChildId != null) {
		    com.sppad.booky.Bookmarks.bookmarkAdded(aItemId, aFolder, aIndex);
		    com.sppad.booky.Bookmarks.bookmarkMoved(aItemId, aParentId, index);
		}
	},
	onItemRemoved: function(aItemId, aFolder, aIndex) {},
	onBeforeItemRemoved: function(aItemId, aItemType, aParentId, aGUID, aParentGUID) {
	    
	    dump("item removed\n");
	    let rootChildId = com.sppad.booky.Bookmarks.getRootFolderChildNodeId(aItemId, aFolder);
	        
		if(rootChildId != null) {
		    dump("starting removal\n");
		    
		    let index = com.sppad.booky.Bookmarks.bookmarksService.getItemIndex(aItemId);
		    com.sppad.booky.Bookmarks.bookmarkRemoved(aItemId, aParentId, index);
		}
	},
	onItemChanged: function(aItemId, aProperty, aIsAnnotationProperty, aNewValue, 
			aLastModified, aItemType, aParentId, aGUID, aParentGUID) {
	    
	    dump("item changed\n");
	    let rootChildId = com.sppad.booky.Bookmarks.getRootFolderChildNodeId(aItemId, aParentId);
	    
		if(aProperty === "uri" && rootChildId != null) {
		    let index = com.sppad.booky.Bookmarks.bookmarksService.getItemIndex(aItemId);
		    com.sppad.booky.Bookmarks.bookmarkRemoved(aItemId, aParentId, index);
		    com.sppad.booky.Bookmarks.bookmarkAdded(aItemId, aParentId, index);
		    com.sppad.booky.Bookmarks.bookmarkMoved(aItemId, aParentId, index);
		}
	},
	onItemVisited: function(aBookmarkId, aVisitID, time) {},
	onItemMoved: function(aItemId, aOldParent, aOldIndex, aNewParent, aNewIndex) {
	    
	    dump("item moved\n");
	    let oldRootChildId = com.sppad.booky.Bookmarks.getRootFolderChildNodeId(aItemId, aOldParent);
	    let newRootChildId = com.sppad.booky.Bookmarks.getRootFolderChildNodeId(aItemId, aNewParent);
	    
		if(oldRootChildId != null && newRootChildId != null)
		    com.sppad.booky.Bookmarks.bookmarkMoved(aItemId, aNewParent, aNewIndex);
		else if(newRootChildId != null)
		    com.sppad.booky.Bookmarks.bookmarkAdded(aItemId, aNewParent, aNewIndex);
		else if(oldRootChildId != null)
		    com.sppad.booky.Bookmarks.bookmarkRemoved(aItemId, aNewParent, aNewIndex);
	},
	
	QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsINavBookmarkObserver])
};

com.sppad.booky.Bookmarks = new function() {
    
    let self = this;

    self._bs = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Components.interfaces.nsINavBookmarksService);
    self._historyService = Components.classes["@mozilla.org/browser/nav-history-service;1"].getService(Components.interfaces.nsINavHistoryService);
    
    self._options = self._historyService.getNewQueryOptions();
    self._query = self._historyService.getNewQuery();
    
	self._getFolder = function(aFolderId) {
	    self._query.setFolders([aFolderId], 1);
	    return self._historyService.executeQuery(self._query, self._options).root;
	};
	
	/**
     * Gets the quick launch bookmark folder, creating it if it does not exist.
     * 
     * @return The quick launch folder
     */
	self._getQuicklaunchFolder = function() {
	     let folder = self._getFolder(self._bs.bookmarksMenuFolder);
         
         try {
             folder.containerOpen = true;
             
             for (let i = 0; i < folder.childCount; i ++) {
                 let node = folder.getChild(i);
               
                 if(node.type === node.RESULT_TYPE_FOLDER && node.title === "QuickLaunchBar")
                     return node.itemId;
             }
             
             return self._bs.createFolder(self._bs.bookmarksMenuFolder, "QuickLaunchBar", self._bs.DEFAULT_INDEX);
         }
         finally {
             folder.containerOpen = false;
         }
	};
	
    self._eventSupport = new com.sppad.booky.EventSupport();
	self._folderId = self._getQuicklaunchFolder();
	
    self._bs.addObserver(com.sppad.booky.BookmarksListener, false);
    
    return {
        rootFolder:                 self._folderId,                 
    	bookmarkFolder:			    self._folderId,
    	bookmarksService:           self._bs,
    	
    	// event types
    	EVENT_ADD_BOOKMARK: 		'EVENT_ADD_BOOKMARK',
    	EVENT_DEL_BOOKMARK:    		'EVENT_DEL_BOOKMARK',
    	EVENT_MOV_BOOKMARK:			'EVENT_MOV_BOOKMARK',
    	EVENT_LOAD_BOOKMARK: 		'EVENT_LOAD_BOOKMARK',
    	
        EVENT_ADD_FOLDER:           'EVENT_ADD_FOLDER',
        EVENT_DEL_FOLDER:           'EVENT_DEL_FOLDER',
        EVENT_MOV_FOLDER:           'EVENT_MOV_FOLDER',
        EVENT_LOAD_FOLDER:          'EVENT_LOAD_FOLDER',
    	
        /**
         * Gets the child node of rootFolder that the item falls under. If the
         * the item falls directly under the root folder, then it is a bookmark
         * item. Otherwise, it is a folder that falls directly under the root
         * folder.
         * 
         * @param aItem
         *            A bookmarks item's id
         * @param aFolderId
         *            The id of the folder that contains aItem
         * 
         * @return Null if aItem is not a descendant of rootFolder; the id of
         *         the child node otherwise.
         */
        getRootFolderChildNodeId: function(aItemId, aFolderId) {
            
            let childId = aItemId;
            let parentId = aFolderId;
            while(parentId && parentId != this.rootFolder) {
                childId = parentId;
                parentId = self._bs.getFolderIdForItem(parentId);
            }
     
            return (parentId == this.rootFolder) ? childId : null;
        },
        
        getBookmarkURI: function(aItemId) {
            return self._bs.getBookmarkURI(aItemId);
        },
        
        getFolderBookmarks: function(aFolderId) {
            let folder = self._getFolder(aFolderId);
            let bookmarks = new Array();
            
            try {
                folder.containerOpen = true;
                
                for (let i = 0; i < folder.childCount; i ++) {
                    let node = folder.getChild(i);
                  
                    switch(node.type) {
                        case node.RESULT_TYPE_URI:
                            bookmarks.push(node);
                            break;
                        case node.RESULT_TYPE_FOLDER:
                            bookmarks.concat(this.getFolderBookmarks(node.itemId));
                            break;
                    }
                }
                
                return bookmarks;
            }
            finally {
                folder.containerOpen = false;
            }
        },
        
    	moveBefore: function(priorBookmarkId, bookmarkId, aFolderId) {
    	    aFolderId = aFolderId || this.rootFolder;
    	    
            targetIndex = priorBookmarkId ? self._bs.getItemIndex(priorBookmarkId) + 1 : 0;
            self._bs.moveItem(bookmarkId, aFolderId, targetIndex); 
    	},
    	
      	bookmarkAdded: function(aItemId, aFolderId, aIndex) {
            let folder = self._getFolder(aFolderId);
      	    
      		try {
      		    folder.containerOpen = true;
		  	  	
		  	  	/*
                 * Ignore about:blank, since in the process of adding a bookmark
                 * through the bookmark manager, it is created initially as
                 * blank (or at least does so on Linux)
                 */
                let node = folder.getChild(aIndex);
                if(node.type == node.RESULT_TYPE_URI && node.uri !== "about:blank")
		    		self._eventSupport.fire( { 'node' : node, }, this.EVENT_ADD_BOOKMARK);
		    	else if(node.type == node.RESULT_TYPE_FOLDER)
                    self._eventSupport.fire( { 'node' : node, }, this.EVENT_ADD_FOLDER);
		    	
//                com.sppad.booky.Utils.dump('bookmarkAdded\n');
//                com.sppad.booky.Utils.dump('\t node.type ' + node.type + "\n");
//                com.sppad.booky.Utils.dump('\t node.uri ' + node.uri + "\n");
	    	} finally {
	    	    folder.containerOpen = false;
			}
    	},
    	
    	bookmarkRemoved: function(aItemId, aFolderId, aIndex) {
            let folder = self._getFolder(aFolderId);
            
    		try {
                folder.containerOpen = true;
                
                let node = folder.getChild(aIndex);
		    	if(node.type == node.RESULT_TYPE_URI)
		    		self._eventSupport.fire( { 'node' : node, }, this.EVENT_DEL_BOOKMARK);
		        else if(node.type == node.RESULT_TYPE_FOLDER)
                    self._eventSupport.fire( { 'node' : node, }, this.EVENT_DEL_FOLDER);
		    	
                com.sppad.booky.Utils.dump('bookmarkRemoved\n');
                com.sppad.booky.Utils.dump('\t node.type ' + node.type + "\n");
                com.sppad.booky.Utils.dump('\t node.uri ' + node.uri + "\n");
	    	} finally {
	    	    folder.containerOpen = false;
			}
    	},
    	
    	bookmarkMoved: function(aItemId, aFolderId, aIndex) {
            let folder = self._getFolder(aFolderId);
    	    
    		try {
                folder.containerOpen = true;
                
    	  	  	// Find first node prior to the moved node of the same type
                let node = folder.getChild(aIndex);
                let nodeNext = null;
    	  	  	for(let i=aIndex+1; i<folder.childCount; i++) {
    	  	  		if(folder.getChild(i).type === node.type) {
    	  	  		    nodeNext = folder.getChild(i);
    	  	  			break;
    	  	  		}	
    	  	  	}
    	  	
    	    	if(node.type == node.RESULT_TYPE_URI)
    	  	  		self._eventSupport.fire( { 'node' : node, 'nodeNext' : nodeNext}, this.EVENT_MOV_BOOKMARK);
                else if(node.type == node.RESULT_TYPE_FOLDER)
                    self._eventSupport.fire( { 'node' : node, 'nodeNext' : nodeNext}, this.EVENT_MOV_FOLDER);
    	    	
//    	        com.sppad.booky.Utils.dump('bookmarkMoved\n');
//                com.sppad.booky.Utils.dump('\t node.type ' + node.type +" \n");
//                com.sppad.booky.Utils.dump('\t node.uri ' + node.uri + "\n");
    		} finally {
    	  	  	folder.containerOpen = false;
    		}
    	},
    	
    	/**
         * Adds the specified uri as a bookmark to the bookmark folder, if it
         * does not already exist.
         * 
         * @param uri
         *            The uri to add a bookmark for.
         * @return The bookmark id of the added bookmark.
         */
    	addBookmark : function(aUriString) {
    	    // Always call self._getQuicklaunchFolder in case it has been
            // deleted
    	    let folder = self._getQuicklaunchFolder();
            let uri = Services.io.newURI(aUriString, null, null);
    	    return self._bs.insertBookmark(folder, uri, self._bs.DEFAULT_INDEX, "");
    	},
    	
        /**
         * Removes a bookmark (or any other item, such as a folder).
         * 
         * @param aItemId
         *            The id of the item to remove
         */
        removeBookmark : function(aItemId) {
            return self._bs.removeItem(aItemId);
        },
    	
    	/**
         * Loads the bookmarks from the specified bookmark folder by firing an
         * EVENT_LOAD_BOOKMARK event for each one.
         */
    	loadBookmarks: function() {
    	    this.loadFolder(this.bookmarkFolder);
        },
        
        loadFolder: function(aFolderId) {
            let folder = self._getFolder(aFolderId);
      
            try {
                folder.containerOpen = true;
                
                for (let i = 0; i < folder.childCount; i ++) {
                    let node = folder.getChild(i);
                  
                    switch(node.type) {
                        case node.RESULT_TYPE_URI:
                            self._eventSupport.fire( { 'node' : node, }, this.EVENT_LOAD_BOOKMARK);
                            break;
                        case node.RESULT_TYPE_FOLDER:
                            this.loadFolder(node.itemId);
                            break;
                    }
                    
//                    com.sppad.booky.Utils.dump('bookmarkLoaded\n');
//                    com.sppad.booky.Utils.dump('\t node.type ' + node.type + "\n");
//                    com.sppad.booky.Utils.dump('\t node.uri ' + node.uri + "\n");
                }
            }
            finally {
                folder.containerOpen = false;
            }
        },
        
        cleanup : function() {
            self._bs.removeObserver(com.sppad.booky.BookmarksListener);
        },
        
        addListener: function(listener, type) { self._eventSupport.addListener(listener, type); },
        removeListener: function(listener, type) { self._eventSupport.removeListener(listener, type); },
    }
};

