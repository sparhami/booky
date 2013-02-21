if (typeof com == "undefined") {
  var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

com.sppad.booky.Details = new function() {

    const CHROME_URI = 'chrome://booky/content/management/details.xul';
    
    let self = this;
    self.tab = null;
    
    /**
     * Shows the details page for a Launcher.
     * 
     * @param aLauncher
     *            The Launcher to show the details page for
     */
    this.showDetailsPage = function(aLauncher) {
        self.openDetailsTab(aLauncher.id);
    };
    
    /**
     * Opens the details page in a tab for a Launcher
     * 
     * @param aLauncherId
     *            The id of a Launcher to open a tab for
     */
    this.openDetailsTab = function(aLauncherId) {
        let uri = CHROME_URI +"?launcherId=" + aLauncherId;
        
        let prevTab = self.tab;
        self.tab = gBrowser.loadOneTab(uri, { 'inBackground' : false } );
        
        // If there is an existing tab, close it
        if(self.isTabOpen(prevTab))
            gBrowser.removeTab(prevTab);
           
    };
    
    /**
     * Checks if the given tab is open in the current window.
     * 
     * @param aTab
     *            The tab to check for
     * @return True if the tab is open, false otherwise
     */
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
        
        if(!contentDocument.location.href.startsWith(CHROME_URI))
            return;
        
        new com.sppad.booky.DetailsPage(contentWindow);
    };
    
    /**
     * Handles a tab select event, setting disablechrome if the tab is a details
     * page.
     */
    this.tabselect = function(aEvent) {
        let tab = aEvent.target;
        let uri = gBrowser.getBrowserForTab(tab).currentURI.asciiSpec;
        
        if(uri.startsWith(CHROME_URI))
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
        
        // Setup views
        self.tabsView = new com.sppad.booky.TabsView(self.contentWindow, self.launcher);
        self.historyView = new com.sppad.booky.HistoryView(self.contentWindow, self.launcher);
        self.bookmarksView = new com.sppad.booky.BookmarksView(self.contentWindow, self.launcher);

        // Register listeners and save a reference
        ['searchBox' , 'titleBox', 'reloadButton', 'closeButton', 'removeButton'].forEach(function(id) {
            self[id] = self.contentDocument.getElementById(id);
            self[id].addEventListener('command', self, false);
        });
        
        self.launcher.addListener(self.tabEvent, self.tabEvents);
        
        self.titleBox.addEventListener('input', self, false);
        self.titleBox.setAttribute('value', self.launcher.title);
        
        // Hide chrome (nav-bar, bookmarks, anything else?)
        document.getElementById('main-window').setAttribute('disablechrome', "true");
        
        self.updateTabCount();
    };
    
    this.cleanup = function() {
        self.contentWindow.removeEventListener('unload', self.cleanup);
        
        self.launcher.removeListener(self.tabEvent, self.tabEvents);
        
        self.tabsView.cleanup();
        self.historyView.cleanup();
        self.bookmarksView.cleanup();
    };
    
    /**
     * Updates the page according to the number of tabs in the launcher.
     * Disables close and reload buttons if there are no tabs open.
     */
    this.updateTabCount = function() {
        ['reloadButton', 'closeButton'].forEach(function(id) {
            self[id].setAttribute('disabled', self.launcher.tabs.length === 0);
        });
    };

    this.tabEvent = function(aEvent) {
        self.updateTabCount();
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