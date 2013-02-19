if (typeof com == "undefined") {
  var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

com.sppad.booky.HistoryView = function(aWindow, aLauncher) {
  
    let self = this;

    self.window = aWindow;
    self.document = aWindow.document;
    self.launcher = aLauncher;
    
    this.setup = function() {
        self.strings = self.document.getElementById("com_sppad_booky_addonstrings");
        
        self.context = self.document.getElementById('history_context');
        self.context.js = self;
        
        self.container = self.document.getElementById('history_view');
        self.container.addEventListener('blur', self.blur, false);
        self.container.addEventListener('keyup', self.keyup, false);
        self.container.addEventListener('dblclick', self.open, false);
        
        self.document.getElementById('history_clear').addEventListener('command', self.removeAll, false);
        self.loadItems();
    };

    this.cleanup = function() {
        self.container.removeEventListener('blur', self.blur);
        self.container.removeEventListener('keyup', self.keyup);
        self.container.removeEventListener('dblclick', self.open);
        
        self.document.getElementById('history_clear').removeEventListener('command', self.removeAll);
    };
    
    /**
     * Loads the items into the view by performing a history query for the
     * launcher's domains.
     */
    this.loadItems = function(searchTerms) {
        window.setTimeout(function() {
            let numberOfDays = -1;
            let maxResults = null;
           
            let domains = self.launcher.getDomains();
            if(domains.length == 0)
                return;
            
            let tree = self.document.getElementById('history_view');
            let res = com.sppad.booky.History.getQueries(domains, numberOfDays, maxResults, searchTerms);
    
            tree.load(res.queries, res.options);
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
     * Opens the currently selected item in a new tab. Only one is allowed
     * currently because a user may accidentally open a large number of history
     * items at once.
     */
    this.open = function() {
        if(self.container.view.selection.count != 1)
            return;

        let items = self.getSelectedItems();
        gBrowser.selectedTab = gBrowser.loadOneTab(items[0].uri);
    };
    
    /**
     * Removes all selected items from the browser history. The view
     * automatically updates to remove the items. Note that the <tree> node
     * handles the delete key, so this is just for the context menu.
     */
    this.remove = function() {
        let uris = self.getSelectedItems().map(function(item) { return item.uri; });
        
        com.sppad.booky.History.removePagesByUris(uris, uris.length);
    };
    
    /**
     * Bookmarks all selected items in the view. Dragging/dropping into
     * bookmarks view is handled by the browser, so this is for the context menu
     * only.
     */
    this.bookmark = function() {
        self.getSelectedItems().forEach(function(item) {
            com.sppad.booky.Bookmarks.addBookmarkToFolder(item.uri, self.launcher.id, item.title);
        });
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
    
    /**
     * Removes all history items for the launcher. Creates a confirmation dialog
     * (in page) before clearing.
     */
    this.removeAll = function() {
        if(!self.window.confirm(self.strings.getString('booky.historyClearConfirmation')))
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
    
    this.setup();
};