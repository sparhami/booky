if (typeof com == "undefined") {
  var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

com.sppad.booky.Details = new function() {
    
    let self = this;
    self.tab = null;
    
    this.showDetailsPage = function(aLauncher) {
        self.openDetailsTab(aLauncher.id);
    };
    
    this.openDetailsTab = function(aLauncherId) {
        let uri = "chrome://booky/content/management/details.xul?launcherId=" + aLauncherId;
        
        let prevTab = self.tab;
        self.tab = gBrowser.loadOneTab(uri, { 'inBackground' : false } );
        
        if(self.isTabOpen(prevTab))
            gBrowser.removeTab(prevTab);
           
    };
    
    this.isTabOpen = function(aTab) {
        let tabs = gBrowser.tabs;
        for(let i=0; i<tabs.length; i++)
            if(tabs[i] == aTab)
                return true;
        
        return false;
    }
    
    this.pageLoaded = function(aEvent) {
        let contentWindow = aEvent.target.data.window;
        let contentDocument = contentWindow.document;
        if(!contentDocument.location.href.startsWith('chrome://booky/content/management/details.xul'))
            return;
        
        new com.sppad.booky.DetailsPage(contentWindow);
    };
    
    this.tabselect = function(aEvent) {
        if(aEvent.target == self.tab)
            document.getElementById('main-window').setAttribute('disablechrome', "true");
    };
    
    this.setup = function() {
        document.addEventListener("com_sppad_booky_details_page_load", self.pageLoaded, false, true);
        document.addEventListener("com_sppad_booky_details_page_beforeunload", self.pageUnloaded, false, true);
        gBrowser.tabContainer.addEventListener("TabSelect", self.tabselect, false);
    };
    
};

com.sppad.booky.DetailsPage = function(aContentWindow) {
    
    let self = this;
    self.contentWindow = aContentWindow;
    self.contentDocument = self.contentWindow.document;
    
    this.setup = function() {
        self.contentWindow.addEventListener('unload', self.cleanup.bind(self), false);
        
        self.strings = self.contentDocument.getElementById("com_sppad_booky_addonstrings");
        self.params = self.getQueryParams(self.contentDocument.location);
        
        self.launcherId = self.params['launcherId'];
        self.launcher = com.sppad.booky.Launcher.getLauncher(self.launcherId);
        if(!self.launcher) {
            com.sppad.booky.Utils.dump("Launcher not found for " + self.launcherId  + "\n");
            return;
        }
        
        self.tabsView = new com.sppad.booky.TabsView(self.contentWindow, self.launcher);
        self.historyView = new com.sppad.booky.HistoryView(self.contentWindow, self.launcher);
        self.bookmarksView = new com.sppad.booky.BookmarksView(self.contentWindow, self.launcher);

        ['searchBox' , 'titleBox', 'reloadButton', 'closeButton', 'removeButton'].forEach(function(id) {
            self[id] = self.contentDocument.getElementById(id);
            self[id].addEventListener('command', self, false);
        });
        
        self.titleBox.addEventListener('input', self, false);
        self.titleBox.setAttribute('value', self.launcher.title);
        
        document.getElementById('main-window').setAttribute('disablechrome', "true");
        
        self.updateTabCount();
    };
    
    this.cleanup = function() {
        self.contentWindow.removeEventListener('unload', self.cleanup);
        
        self.tabsView.cleanup();
        self.historyView.cleanup();
        self.bookmarksView.cleanup();
    };
    
    this.updateTabCount = function() {
        ['reloadButton', 'closeButton'].forEach(function(id) {
            self[id].setAttribute('disabled', self.launcher.tabs.length === 0);
        });
    };
    
    this.handleEvent = function(aEvent) {
        let id = aEvent.target.id;
        let value = aEvent.target.value;
        
        switch(id) {
            case 'searchBox':
                self.historyView.loadItems(value);
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
                    com.sppad.booky.Bookmarks.removeBookmark(self.launcher.id);
                    self.contentWindow.close();
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
    
    this.setup();
}

window.addEventListener("load", function() {
    com.sppad.booky.Details.setup();
}, false);