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
	
	onItemAdded: function(aItemId, aFolderId, aIndex) {
	    com.sppad.booky.Bookmarks.bookmarkAdded(aItemId, aFolderId, aIndex);
	},
	onItemRemoved: function(aItemId, aFolderId, aIndex) {},
	onBeforeItemRemoved: function(aItemId, aItemType, aFolderId, aGUID, aParentGUID) {
        let index = com.sppad.booky.Bookmarks.bookmarksService.getItemIndex(aItemId);
        com.sppad.booky.Bookmarks.bookmarkRemoved(aItemId, aFolderId, index);
	},
	onItemChanged: function(aItemId, aProperty, aIsAnnotationProperty, aNewValue, 
			aLastModified, aItemType, aParentId, aGUID, aParentGUID) {
	    
        let index = com.sppad.booky.Bookmarks.bookmarksService.getItemIndex(aItemId);
	    
		if(aProperty === "uri") {
		    com.sppad.booky.Bookmarks.bookmarkRemoved(aItemId, aParentId, index);
		    com.sppad.booky.Bookmarks.bookmarkAdded(aItemId, aParentId, index);
		}
		
		if(aProperty === "title") {
		    com.sppad.booky.Bookmarks.bookmarkTitleChanged(aItemId, aParentId, index, aNewValue);
		}
	},
	onItemVisited: function(aBookmarkId, aVisitID, time) {},
	onItemMoved: function(aItemId, aOldParent, aOldIndex, aNewParent, aNewIndex) {
	    com.sppad.booky.Bookmarks.bookmarkMoved(aItemId, aNewParent, aNewIndex);
	},
	
	QueryInterface: XPCOMUtils.generateQI([Components.interfaces.nsINavBookmarkObserver])
};

com.sppad.booky.Bookmarks = new function() {

    let self = this;

    self._BOOKMARK_FOLDER_TITLE = "QuickLaunchBar";
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
	self._getQuicklaunchFolderId = function() {

        /*
         * Need to make sure that we haven't been deleted and had another folder
         * recreated with the same item id.
         */
	     let item = self._getFolder(self._bookmarkFolderId);
	     if(item.title == self._BOOKMARK_FOLDER_TITLE)
	         return self._bookmarkFolderId;
	         
         let rootFolder = self._getFolder(self._bs.bookmarksMenuFolder);
         
         try {
             rootFolder.containerOpen = true;
             
             // Look for the first folder with the correct title
             for (let i = 0; i < rootFolder.childCount; i ++) {
                 let node = rootFolder.getChild(i);
               
                 if(node.type === node.RESULT_TYPE_FOLDER && node.title === self._BOOKMARK_FOLDER_TITLE)
                     return node.itemId;
             }
             
             return self._bookmarkFolderId = self._bs.createFolder(self._bs.bookmarksMenuFolder, self._BOOKMARK_FOLDER_TITLE, self._bs.DEFAULT_INDEX);
         }
         finally {
             rootFolder.containerOpen = false;
         }  
	};
	
	// Initialize bookmark folder id to root
	self._bookmarkFolderId = self._bs.bookmarksMenuFolder;
    self._eventSupport = new com.sppad.booky.EventSupport();
    self._bs.addObserver(com.sppad.booky.BookmarksListener, false);
    
    return {
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
        
        EVENT_UPDATE_TITLE:         'EVENT_UPDATE_TITLE',
    	
        
        isQuickLaunchFolder: function(aItemId) {
            return aItemId == self._getQuicklaunchFolderId();
        },
        
        getBookmarkURI: function(aItemId) {
            return self._bs.getBookmarkURI(aItemId);
        },
        
        getTitle: function(aItemId) {
            return self._bs.getItemTitle(aItemId);
        },
        
        getFolder: function(aItemId) {
            return self._bs.getFolderIdForItem(aItemId);
        },
        
        createFolder: function(aTitle, anIndex) {
            let targetIndex = anIndex || self._bs.DEFAULT_INDEX;
            return self._bs.createFolder(self._getQuicklaunchFolderId(), aTitle, targetIndex);
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
            } finally {
                folder.containerOpen = false;
            }
        },
        
    	moveBefore: function(priorBookmarkId, bookmarkId, aFolderId) {
    	    aFolderId = aFolderId || self._getQuicklaunchFolderId();
    	    
            targetIndex = priorBookmarkId ? self._bs.getItemIndex(priorBookmarkId) + 1 : self._bs.DEFAULT_INDEX;
            self._bs.moveItem(bookmarkId, aFolderId, targetIndex); 
    	},
    	
    	bookmarkTitleChanged: function(aItemId, aParentId, aIndex, aTitle) {
            // Prevent user from changing our folder's title by restoring it
    	    if(aItemId == self._bookmarkFolderId && aTitle != self._BOOKMARK_FOLDER_TITLE)
    	        self._bs.setItemTitle(aItemId, self._BOOKMARK_FOLDER_TITLE);
    	    
            let folder = self._getFolder(aParentId);
            
            try {
                folder.containerOpen = true;
                
                let node = folder.getChild(aIndex);
                self._eventSupport.fire( { 'node' : node, }, this.EVENT_UPDATE_TITLE);
            } finally {
                folder.containerOpen = false;
            }
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
                let nodeNext = (aIndex + 1 >= folder.childCount) ? null : folder.getChild(aIndex + 1);
                let obj = { 'node' : node, 'nodeNext' : nodeNext};
                
                if(node.type == node.RESULT_TYPE_URI && node.uri !== "about:blank")
		    		self._eventSupport.fire(obj, this.EVENT_ADD_BOOKMARK);
		    	else if(node.type == node.RESULT_TYPE_FOLDER)
                    self._eventSupport.fire(obj, this.EVENT_ADD_FOLDER);
		    	
	    	} finally {
	    	    folder.containerOpen = false;
			}
    	},
    	
    	bookmarkRemoved: function(aItemId, aFolderId, aIndex) {
            let folder = self._getFolder(aFolderId);
            
    		try {
                folder.containerOpen = true;
                
                let node = folder.getChild(aIndex);
                let nodeNext = (aIndex + 1 >= folder.childCount) ? null : folder.getChild(aIndex + 1);
                let obj = { 'node' : node, 'nodeNext' : nodeNext};
                
		    	if(node.type == node.RESULT_TYPE_URI)
		    		self._eventSupport.fire(obj, this.EVENT_DEL_BOOKMARK);
		        else if(node.type == node.RESULT_TYPE_FOLDER)
                    self._eventSupport.fire(obj, this.EVENT_DEL_FOLDER);
		    	
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
                let nodeNext = (aIndex + 1 >= folder.childCount) ? null : folder.getChild(aIndex + 1);
                let obj = { 'node' : node, 'nodeNext' : nodeNext};
                
    	    	if(node.type == node.RESULT_TYPE_URI)
    	  	  		self._eventSupport.fire(obj, this.EVENT_MOV_BOOKMARK);
                else if(node.type == node.RESULT_TYPE_FOLDER)
                    self._eventSupport.fire(obj, this.EVENT_MOV_FOLDER);
    	    	
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
    	    // Always call self._getQuicklaunchFolderId in case it has been
            // deleted
    	    let folder = self._getQuicklaunchFolderId();
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
    	    this.loadFolder(self._getQuicklaunchFolderId());
        },
        
        loadFolder: function(aFolderId) {
            let folder = self._getFolder(aFolderId);
      
            try {
                folder.containerOpen = true;
                
                // Save off all the nodes, since the folder may change contents
                let nodes = new Array();
                for (let i = 0; i < folder.childCount; i ++)
                    nodes.push(folder.getChild(i));
                
                for (let i = 0; i < nodes.length; i ++) {
                    
                    let node = nodes[i];
                    let obj = { 'node' : node };
                    
                    switch(node.type) {
                        case node.RESULT_TYPE_URI:
                            self._eventSupport.fire(obj, this.EVENT_LOAD_BOOKMARK);
                            break;
                        case node.RESULT_TYPE_FOLDER:
                            self._eventSupport.fire(obj, this.EVENT_LOAD_FOLDER);
                            break;
                    }
                }
            } finally {
                folder.containerOpen = false;
            }
        },
        
        getBookmarks: function(aFolderId, ignoreId) {
            let folder = self._getFolder(aFolderId);
            let array = new Array();
            
            try {
                folder.containerOpen = true;
            
                for (let i = 0; i < folder.childCount; i ++) {
                    let node = folder.getChild(i);

                    if(node.itemId != ignoreId)
                        array.push( { 'icon': node.icon, 'uri': node.uri, 'itemId' : node.itemId });
                }
                
                return array;
            } finally {
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