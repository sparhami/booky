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
        self.container.addEventListener('dblclick', self.onOpen, false);
        
        self.document.getElementById('history_clear').addEventListener('command', self.removeAll, false);
    };
    
    this.cleanup = function() {
        self.container.removeEventListener('blur', self.blur);
        self.container.removeEventListener('keyup', self.keyup);
        self.container.removeEventListener('dblclick', self.onOpen);
        
        self.document.getElementById('history_clear').removeEventListener('command', self.removeAll);
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
    
    this.open = function() {
        if(self.container.view.selection.count != 1)
            return;

        let items = self.getSelectedItems();
        gBrowser.selectedTab = gBrowser.loadOneTab(items[0].uri);
    };
    
    this.remove = function() {
        let uris = self.getSelectedItems().map(function(item) { return item.uri; });
        
        com.sppad.booky.History.removePagesByUris(uris, uris.length);
    };
    
    this.bookmark = function() {
        self.getSelectedItems().forEach(function(item) {
            com.sppad.booky.Bookmarks.addBookmarkToFolder(item.uri, self.launcher.id, item.title);
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
    
    this.removeAll = function() {
        if(!self.window.confirm(self.strings.getString("booky.historyClearConfirmation")))
            return;
        
        let hosts = self.launcher.getDomains();
        com.sppad.booky.History.removePagesByHosts(hosts);
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
        let removeItem = self.document.getElementById('history_context_remove');
        removeItem.setAttribute('disabled', self.container.view.selection.count == 0);
        
        let openItem = self.document.getElementById('history_context_open');
        openItem.setAttribute('disabled', self.container.view.selection.count != 1);
        
        let bookmarkItem = self.document.getElementById('history_context_bookmark');
        bookmarkItem.setAttribute('disabled', self.container.view.selection.count == 0);
    };
};