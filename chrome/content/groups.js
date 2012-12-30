if (typeof com == "undefined") {
  var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

com.sppad.booky.Groups = new function() {
    
    var self = this;
    
    this.folderIDs = new Array();
    
    return {
        
        handleEvent : function(aEvent) {
            switch (aEvent.type)
            {
                case com.sppad.booky.Bookmarks.EVENT_ADD_FOLDER:
                case com.sppad.booky.Bookmarks.EVENT_LOAD_FOLDER:
                    return this.onFolderAdded(aEvent);
                case com.sppad.booky.Bookmarks.EVENT_MOV_FOLDER:
                    return this.onFolderMoved(aEvent);
                case com.sppad.booky.Bookmarks.EVENT_DEL_FOLDER:
                    return this.onFolderRemoved(aEvent);
                default:
                    return null;
            }
        },
        
        onFolderAdded: function(event) {
            let node = event.node;
        },
        
        onFolderRemoved: function(event) {
            let node = event.node;
        },
        
        onFolderMoved: function(event) {
            let node = event.node;
            let nodeNext = event.nodeNext;
        },
        
        onBookmarkMoved: function(event) {
            
            // Check if parent is root
            //if(event.node === )
            
            
            
        },
        
        addFolder: function(aFolderID, aBookmarkArray) {
            
            
        },
        
        removeFolder: function(aFolderID) {
            
            
        },
        
        setup: function() {
            com.sppad.booky.Bookmarks.addListener(this);
            
        },
        
        cleanup: function() {
            com.sppad.booky.Bookmarks.removeListener(this);
        },
    }
    
};




/**
 * Gets the launcher ID for a given tab. Currently this is based off the
 * hostname only.
 * 
 * @param aTab
 *            A browser tab
 * @return The id for the launcher for aTab
 */
com.sppad.booky.Groups.getIdFromTab = function(aTab) {
    let currentUri = gBrowser.getBrowserForTab(aTab).currentURI;
    
    try {
        return currentUri.host || currentUri.asciiSpec;
    } catch(err) {
        try {
            return currentUri.asciiSpec;
        } catch(err) {
            return aTab.label;
        }
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
com.sppad.booky.Groups.getIdFromUriString = function(uriString) {
    try {
        return Services.io.newURI(uriString, null, null).host || uriString;
    } catch(err) {
        return uriString;
    }
};