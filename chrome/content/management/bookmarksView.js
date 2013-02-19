if (typeof com == "undefined") {
  var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

com.sppad.booky.BookmarksView = new function() {
    
    var self = this;
    self._bs = Components.classes["@mozilla.org/browser/nav-bookmarks-service;1"].getService(Components.interfaces.nsINavBookmarksService);
    self._historyService = Components.classes["@mozilla.org/browser/nav-history-service;1"].getService(Components.interfaces.nsINavHistoryService);
 
    this.setup = function(aWindow, aLauncher) {
        self.window = aWindow;
        self.document = aWindow.document;
        self.launcher = aLauncher;
        
        self.context = self.document.getElementById('bookmarks_context');
        self.context.js = self;
        
        self.container = self.document.getElementById('bookmarks_view');
        self.container.addEventListener('blur', self.blur, false);
        self.container.addEventListener('keyup', self.keyup, false);
        self.container.addEventListener('dblclick', self.open, false);
    };
    
    this.cleanup = function() {
        self.container.removeEventListener('blur', self.blur);
        self.container.removeEventListener('keyup', self.keyup);
        self.container.removeEventListener('dblclick', self.open);
    };
    
    /**
     * Loads the items into the view by performing a bookmarks query for the
     * launcher's folder id.
     */
    this.loadItems = function() {
        window.setTimeout(function() {
            let options = self._historyService.getNewQueryOptions();
            let query = self._historyService.getNewQuery();
            query.setFolders([ self.launcher.id ], 1);
            
            let tree = self.document.getElementById('bookmarks_view');
    
            tree.load([ query ], options);
        }, 1);
    };
    
    /**
     * Handle loss of focus by clearing the selected items. Occurs through
     * escape key or by clicking off the view.
     */
    this.blur = function() {
        self.container.view.selection.clearSelection();
    };
    
    /**
     * Opens all selected items in new tabs.
     */
    this.open = function() {
        self.getSelectedItems().forEach(function(item) {
            gBrowser.selectedTab = gBrowser.loadOneTab(item.uri);
        });
    };
    
    /**
     * Removes all selected items from the bookmarks. The view automatically
     * updates to remove the items. Note that the <tree> node handles the delete
     * key, so this is just for the context menu.
     */
    this.remove = function() {
        self.getSelectedItems().forEach(function(item) { 
            self._bs.removeItem(item.itemId);
        });
    };
    
    this.assign = function() {
        
        let items = self.getSelectedItems();
        com.sppad.booky.LauncherAssignmentDialog.open(self.window, function(aLauncher) {
            items.forEach(function(item) {
                com.sppad.booky.Bookmarks.moveBefore(null, item.itemId, aLauncher.id);
            });
        });
        self.container.blur();
    };
    
    /**
     * Get the items currently selected in the view.
     * 
     * @return An array containing the currently selected items.
     */
    this.getSelectedItems = function() {
        let items = [];

        let tree = self.container;
        let start = {};
        let end = {};
        let numRanges = tree.view.selection.getRangeCount();
        
        for (let t = 0; t < numRanges; t++){
            tree.view.selection.getRangeAt(t, start, end);
            for (let v = start.value; v <= end.value; v++) {
                items.push(tree.view.nodeForTreeIndex(v));
            }
        }
        
        return items;
    };
    
    this.keyup = function(aEvent) {
        
        switch(aEvent.keyCode) {
            case KeyEvent.DOM_VK_RETURN:
                self.open();
                break;
            case KeyEvent.DOM_VK_ESCAPE:
                self.blur();
                break;
            default:
                break;
        }
        
    };
    
    this.popupShowing = function() {
        let removeItem = self.document.getElementById('bookmarks_context_remove');
        removeItem.setAttribute('disabled', self.container.view.selection.count == 0);
        
        let openItem = self.document.getElementById('bookmarks_context_open');
        openItem.setAttribute('disabled', self.container.view.selection.count == 0);
        
        let assignItem = self.document.getElementById('bookmarks_context_assign');
        assignItem.setAttribute('disabled', self.container.view.selection.count == 0);
    };
};