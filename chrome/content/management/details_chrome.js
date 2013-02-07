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
        let contentDocument = aEvent.originalTarget.document;
        if(!contentDocument.location.href.startsWith('chrome://booky/content/management/details.xul'))
            return;
        
        contentDocument.title = "Booky - details";
        
        self.params = self.getQueryParams(contentDocument.location);
        
        let launcherId = self.params['launcherId'];
        let launcher = com.sppad.booky.Launcher.getLauncher(launcherId);
        if(!launcher) {
            com.sppad.booky.Utils.dump("Launcher not found for " + launcherId  + "\n");
            return;
        }
        
        com.sppad.booky.TabsView.setup(contentDocument, launcher);
        com.sppad.booky.HistoryView.setup(contentDocument, launcher);
        com.sppad.booky.BookmarksView.setup(contentDocument, launcher);
        
        self.setupPage();
        
        gBrowser.tabContainer.addEventListener("TabSelect", self.tabselect, false);
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
        gBrowser.tabContainer.addEventListener("TabSelect", self.tabselect, false);
    };
    
};

window.addEventListener("load", function() {
    com.sppad.booky.Details.setup();
}, false);