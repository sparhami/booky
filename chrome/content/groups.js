if (typeof com == "undefined") {
  var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

com.sppad.booky.Groups = new function() {
    
    var self = this;
    
    this.folderIDs = new Array();
    
    return {
        
        addFolder: function(aFolderID, aBookmarkArray) {
            
            
        },
        
        removeFolder: function(aFolderID) {
            
            
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