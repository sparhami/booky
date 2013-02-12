if (typeof com == "undefined") {
  var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

com.sppad.booky.Details = new function() {
    
    var self = this;
    self.tab = null;
    
    this.showDetailsPage = function(aLauncher) {
        self.openDetailsTab(aLauncher.id);
    };
    
    this.openDetailsTab = function(aLauncherId) {
        let uri = "chrome://booky/content/management/details.xul?launcherId=" + aLauncherId;
        
        if(self.isTabOpen(self.tab))
            gBrowser.removeTab(self.tab);
           
        self.tab = gBrowser.loadOneTab(uri, { 'inBackground' : false } );
    };
    
    this.isTabOpen = function(aTab) {
        let tabs = gBrowser.tabs;
        for(let i=0; i<tabs.length; i++)
            if(tabs[i] == aTab)
                return true;
        
        return false;
    }
    
    this.tabselect = function(aEvent) {
        if(aEvent.target == self.tab)
            self.setupPage();
    };
    
    this.setupPage = function() {
        // Hide chrome (e.g. nav bar)
        document.getElementById('main-window').setAttribute('disablechrome', "true");
        
        com.sppad.booky.TabsView.loadItems();
        com.sppad.booky.HistoryView.loadItems();
        com.sppad.booky.BookmarksView.loadItems();
        
        self.updateTabCount();
    };
    
    this.pageLoaded = function(aEvent) {
        let contentWindow = aEvent.target.data.window;
        let contentDocument = contentWindow.document;
        if(!contentDocument.location.href.startsWith('chrome://booky/content/management/details.xul'))
            return;
        
        self.strings = contentDocument.getElementById("com_sppad_booky_addonstrings");
        self.contentWindow = contentWindow;
        self.params = self.getQueryParams(contentDocument.location);
        
        self.launcherId = self.params['launcherId'];
        self.launcher = com.sppad.booky.Launcher.getLauncher(self.launcherId);
        if(!self.launcher) {
            com.sppad.booky.Utils.dump("Launcher not found for " + self.launcherId  + "\n");
            return;
        }
        
        com.sppad.booky.TabsView.setup(contentWindow, self.launcher);
        com.sppad.booky.HistoryView.setup(contentWindow, self.launcher);
        com.sppad.booky.BookmarksView.setup(contentWindow, self.launcher);
        
        gBrowser.tabContainer.addEventListener("TabSelect", self.tabselect, false);
        gBrowser.tabContainer.addEventListener("TabClose", self.tabEvent, false);
        gBrowser.tabContainer.addEventListener("TabOpen", self.tabEvent, false);

        ['searchBox' , 'titleBox', 'reloadButton', 'closeButton', 'removeButton'].forEach(function(id) {
            self[id] = contentDocument.getElementById(id);
            self[id].addEventListener('command', self, false);
        });
        
        self.titleBox.addEventListener('input', self, false);
        self.titleBox.setAttribute('value', self.launcher.title);
        
        self.setupPage();
    };
    
    this.pageUnloaded = function(aEvent) {
        let contentWindow = aEvent.target.data.window;
        let contentDocument = contentWindow.document;
        if(!contentDocument.location.href.startsWith('chrome://booky/content/management/details.xul'))
            return;
        
        com.sppad.booky.TabsView.cleanup();
        com.sppad.booky.HistoryView.cleanup();
        com.sppad.booky.BookmarksView.cleanup();
        
        gBrowser.tabContainer.removeEventListener("TabSelect", self.tabselect);
        gBrowser.tabContainer.removeEventListener("TabClose", self.tabEvent);
        gBrowser.tabContainer.removeEventListener("TabOpen", self.tabEvent);
    };
    
    this.updateTabCount = function() {
        ['reloadButton', 'closeButton'].forEach(function(id) {
            self[id].setAttribute('disabled', self.launcher.tabs.length === 0);
        });
    };
    
    this.tabEvent = function(aEvent) {
        self.updateTabCount();
        com.sppad.booky.TabsView.loadItems();
    };
    
    this.handleEvent = function(aEvent) {
        let id = aEvent.target.id;
        let value = aEvent.target.value;
        
        switch(id) {
            case 'searchBox':
                com.sppad.booky.HistoryView.loadItems(value);
                break;
            case 'titleBox':
                com.sppad.booky.Bookmarks.setTitle(self.launcher.id, value);
                break;
            case 'reloadButton':
                self.launcher.reload();
                break;
            case 'closeButton':
                if(self.contentWindow.confirm(self.strings.getString("booky.closeConfirmation"))) {
                    self.launcher.close();
                }

                break;
            case 'removeButton':
                if(self.contentWindow.confirm(self.strings.getString("booky.removeConfirmation"))) {
                    self.launcher.remove();
                    gBrowser.removeTab(self.tab);
                }
       
                break;
        }
    };

    
    /**
     * Gets the query parameters for a location.
     * 
     * @param aLocation
     *            The location field of a document
     * @return An object mapping parameter names to values
     */
    this.getQueryParams = function(aLocation) {
        let vars = aLocation.search.substring(1).split('&');
        let params = {};
        
        for (let i = 0; i < vars.length; i++) {
            let pair = vars[i].split('=');
            params[pair[0]] = pair[1];
        }
        
        return params;
    };
    
    this.setup = function() {
        document.addEventListener("com_sppad_booky_details_page_load", self.pageLoaded, false, true);
        document.addEventListener("com_sppad_booky_details_page_beforeunload", self.pageUnloaded, false, true);
        gBrowser.tabContainer.addEventListener("TabSelect", self.tabselect, false);
    };
    
};

window.addEventListener("load", function() {
    com.sppad.booky.Details.setup();
}, false);