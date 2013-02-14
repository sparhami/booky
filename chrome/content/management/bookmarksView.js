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
    
    this.loadItems = function() {
      
        let options = self._historyService.getNewQueryOptions();
        let query = self._historyService.getNewQuery();
        query.setFolders([ self.launcher.id ], 1);
        
        let tree = self.document.getElementById('bookmarks_view');

        tree.load([ query ], options);
    };
    
    this.blur = function() {
        self.container.view.selection.clearSelection();
    };
    
    this.open = function() {
        self.getSelectedItems().forEach(function(item) {
            gBrowser.selectedTab = gBrowser.loadOneTab(item.uri);
        });
    };
    
    this.remove = function() {
        self.getSelectedItems().forEach(function(item) { 
            self._bs.removeItem(item.itemId);
        });
    };
    
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
    };
};