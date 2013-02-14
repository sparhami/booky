if (typeof com == "undefined") {
  var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

com.sppad.booky.HistoryView = new function() {
    
    var self = this;
    
    this.setup = function(aWindow, aLauncher) {
        self.window = aWindow;
        self.document = aWindow.document;
        self.launcher = aLauncher;
        
        self.strings = self.document.getElementById("com_sppad_booky_addonstrings");
        
        self.context = self.document.getElementById('history_context');
        self.context.js = self;
        
        self.container = self.document.getElementById('history_view');
        self.container.addEventListener('blur', self.blur, false);
        self.container.addEventListener('keyup', self.keyup, false);
        self.container.addEventListener('dblclick', self.onAction, false);
        
        self.document.getElementById('history_clear').addEventListener('command', self.onDeleteAll, false);
    };
    
    this.cleanup = function() {
        self.container.removeEventListener('blur', self.blur);
        self.container.removeEventListener('keyup', self.keyup);
        self.container.removeEventListener('dblclick', self.onAction);
        
        self.document.getElementById('history_clear').removeEventListener('command', self.onDeleteAll);
   
    };
    
    this.loadItems = function(searchTerms) {
        let numberOfDays = -1;
        let maxResults = null;
       
        let domains = self.launcher.getDomains();
        if(domains.length == 0)
            return;
        
        let tree = self.document.getElementById('history_view');
        let res = com.sppad.booky.History.getQueries(domains, numberOfDays, maxResults, searchTerms);

        tree.load(res.queries, res.options);
    };
    
    this.blur = function() {
        self.container.view.selection.clearSelection();
    };
    
    this.onAction = function() {
        if(self.container.view.selection.count != 1)
            return;

        let items = self.getSelectedItems();
        gBrowser.selectedTab = gBrowser.loadOneTab(items[0].uri);
    };
    
    this.onOpen = function() {
        self.onAction();
    };
    
    this.onDelete = function() {
        let items = self.getSelectedItems();
        let uris = items.map(function(item) { return item.uri; });
        
        com.sppad.booky.History.removePagesByUris(uris, uris.length);
    };
    
    this.onBookmark = function() {
        let items = self.getSelectedItems();
        let uris = items.map(function(item) { return item.uri; });
        
        uris.forEach(function(uri) {
            com.sppad.booky.Bookmarks.addBookmarkToFolder(uri, self.launcher.id);
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
    
    this.onDeleteAll = function() {
        if(!self.window.confirm(self.strings.getString("booky.historyClearConfirmation")))
            return;
        
        let hosts = self.launcher.getDomains();
        com.sppad.booky.History.removePagesByHosts(hosts);
        
        self.loadItems();
    };
    
    this.keyup = function(aEvent) {
        
        switch(aEvent.keyCode) {
            case KeyEvent.DOM_VK_RETURN:
                self.onAction();
                break;
            case KeyEvent.DOM_VK_DELETE:
                self.onDelete();
                break;
            case KeyEvent.DOM_VK_ESCAPE:
                self.blur();
                break;
            default:
                break;
        }
        
    };
    
    this.popupShowing = function() {
        let removeItem = self.document.getElementById('history_context_remove');
        removeItem.setAttribute('disabled', self.container.view.selection.count == 0);
        
        let openItem = self.document.getElementById('history_context_open');
        openItem.setAttribute('disabled', self.container.view.selection.count != 1);
        
        let bookmarkItem = self.document.getElementById('history_context_bookmark');
        bookmarkItem.setAttribute('disabled', self.container.view.selection.count == 0);
    };
};