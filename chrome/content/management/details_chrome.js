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
        let uri = 'chrome://booky/content/management/details.xul?launcherId=' + aLauncherId;
        
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
        document.documentElement.setAttribute("disablechrome", "true");
        
        com.sppad.booky.TabsView.loadItems();
        com.sppad.booky.HistoryView.loadItems();
        com.sppad.booky.BookmarksView.loadItems();
    };
    
    this.pageLoaded = function(aEvent) {
        let contentDocument = aEvent.target.data.document;
        if(!contentDocument.location.href.startsWith('chrome://booky/content/management/details.xul'))
            return;
        
        self.params = self.getQueryParams(contentDocument.location);
        
        self.launcherId = self.params['launcherId'];
        self.launcher = com.sppad.booky.Launcher.getLauncher(self.launcherId);
        if(!self.launcher) {
            com.sppad.booky.Utils.dump("Launcher not found for " + self.launcherId  + "\n");
            return;
        }
        
        com.sppad.booky.TabsView.setup(contentDocument, self.launcher);
        com.sppad.booky.HistoryView.setup(contentDocument, self.launcher);
        com.sppad.booky.BookmarksView.setup(contentDocument, self.launcher);
        
        self.setupPage();
        
        gBrowser.tabContainer.addEventListener("TabSelect", self.tabselect, false);
        
        contentDocument.getElementById('searchBox').addEventListener('command', self.onSearch, false);
        contentDocument.getElementById('titleBox').addEventListener('change', self.onTitleSet, false);
    };
    
    this.pageUnloaded = function(aEvent) {
        let contentDocument = aEvent.target.data.document;
        if(!contentDocument.location.href.startsWith('chrome://booky/content/management/details.xul'))
            return;
        
        gBrowser.tabContainer.removeEventListener("TabSelect", self.tabselect);
    };
    
    this.onTitleSet = function(aEvent) {
        let value = aEvent.target.value;
        com.sppad.booky.Bookmarks.setTitle(self.launcher.id, value);
    };
    
    this.onSearch = function(aEvent) {
        let value = aEvent.target.value;
        dump("search for " + value + "\n");
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
        // Add the details page URI to the list of pages to set disablechrome on
        XULBrowserWindow.inContentWhitelist.push("chrome://booky/content/management/details.xul");

        document.addEventListener("com_sppad_booky_details_page_loaded", self.pageLoaded, false, true);
        document.addEventListener("com_sppad_booky_details_page_unloaded", self.pageUnloaded, false, true);
        document.addEventListener("com_sppad_booky_details_search", self.search, false, true);
        gBrowser.tabContainer.addEventListener("TabSelect", self.tabselect, false);
    };
    
};

window.addEventListener("load", function() {
    com.sppad.booky.Details.setup();
}, false);