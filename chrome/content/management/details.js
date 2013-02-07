if (typeof com == "undefined") {
  var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

com.sppad.booky.Details = new function() {
    
    var self = this;
    self.loading = false;
    self.launcher = null;
    self.document = null;
    self.results = null;
    
    /** A weak reference to the tab containing the details page */
    self.tab = null;
    
    this.showDetailsPage = function(aLauncher) {
        self.launcher = aLauncher;
        
        if(self.loading)
            return;
        
        com.sppad.booky.TabsView.setLauncher(aLauncher);
        com.sppad.booky.HistoryView.setLauncher(aLauncher);
        com.sppad.booky.BookmarksView.setLauncher(aLauncher);
        
        self.openDetailsTab();
    };
    
    this.openDetailsTab = function() {
        if(self.isTabOpen(self.tab)) {
            if(gBrowser.selectedTab == self.tab)
                self.setupPage();
            else
                gBrowser.selectedTab = self.tab;
        } else {
            gBrowser.selectedTab = gBrowser.loadOneTab('chrome://booky/content/management/details.xul');
            
            self.tab = gBrowser.selectedTab;
            self.loading = true;
            
            document.getElementById("appcontent").addEventListener('DOMContentLoaded', self.onPageLoad, true);
        }
    };
    
    this.isTabOpen = function(aTab) {
        let tabs = gBrowser.tabs;
        for(let i=0; i<tabs.length; i++)
            if(tabs[i] == aTab)
                return true;
        
        return false;
    }
    
    this.tabselect = function(aEvent) {
        if(aEvent.target == self.tab && !self.loading)
            self.setupPage();
    };
    
    
    this.openUri = function(aUri) {
        gBrowser.selectedTab = gBrowser.loadOneTab(aUri);
    };
    
    this.onPageLoad = function(aEvent) {
        let doc = aEvent.originalTarget;
        if(doc.location.href != 'chrome://booky/content/management/details.xul')
            return;
        
        gBrowser.tabContainer.addEventListener("TabSelect", self.tabselect, false);
        
        // Don't need to listen for load anymore
        document.getElementById('appcontent').removeEventListener('DOMContentLoaded', this.onPageLoad);
        
        self.document = doc;
        com.sppad.booky.TabsView.setup(self.document);
        com.sppad.booky.HistoryView.setup(self.document);
        com.sppad.booky.BookmarksView.setup(self.document);
        
        self.setupPage();
        self.loading = false;
        

        doc.defaultView.addEventListener("unload", function(event){ self.onPageUnload(event); }, true);
    };
    
    this.onPageUnload = function(aEvent) {
        gBrowser.tabContainer.removeEventListener("TabSelect", self.tabselect);
    };
    
    this.setupPage = function() {
        
        com.sppad.booky.TabsView.loadItems();
        com.sppad.booky.HistoryView.loadItems();
        com.sppad.booky.BookmarksView.loadItems();

    };
    
    this.setup = function() {
        // Add the details page URI to the list of pages to set disablechrome on
        XULBrowserWindow.inContentWhitelist.push("chrome://booky/content/management/details.xul");
    };
    
};

window.addEventListener("load", function() {
    com.sppad.booky.Details.setup();
}, false);