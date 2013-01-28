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
    
    /** A weak reference to the tab containing the details page */
    self.tab = null;
    
    this.showDetailsPage = function(aLauncher) {
        self.launcher = aLauncher;
        
        if(self.loading)
            return;
        
        self.openDetailsTab();
    };
    
    this.openDetailsTab = function() {
        if(self.isTabOpen(self.tab)) {
            if(gBrowser.selectedTab == self.tab)
                self.setupPage();
            else
                gBrowser.selectedTab = self.tab;
        } else {
            gBrowser.selectedTab = gBrowser.loadOneTab('chrome://booky/content/launcher/details.xul');
            
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
    
    this.listBlur = function(aEvent) {
        
        
    };
    
    this.loadHistory = function() {
        
        let container = self.document.getElementById('history_content');
        while(container.hasChildNodes())
            container.removeChild(container.lastChild);
        
        let numberOfDays = 365;
        let maxResults = 1000;
       
        let domains = self.launcher.getDomains();
        if(domains.length == 0)
            return;
        
        let results = com.sppad.booky.History.queryHistoryArray(domains, numberOfDays, maxResults);
        
        for(let i=0; i<results.length; i++) {
            let result = results[i];
            
            let item = self.document.createElement('listitem');
            item.setAttribute('class', 'listitem-iconic');
            item.setAttribute('label', result.title);
            item.setAttribute('image', result.icon);
            item.setAttribute('tooltiptext', result.uri);
            
            item.addEventListener('dblclick', self.openUri.bind(self, result.uri), true);
            
            container.appendChild(item);
        }
    };
    
    this.loadBookmarks = function() {
        
        let container = self.document.getElementById('bookmarks_content');
        while(container.hasChildNodes())
            container.removeChild(container.lastChild);
        
        let bookmarks = self.launcher.bookmarksArray;
        for(let i=0; i<bookmarks.length; i++) {
            let bookmark = bookmarks[i];
            
            let item = self.document.createElement('listitem');
            item.setAttribute('class', 'listitem-iconic');
            item.setAttribute('label', bookmark.title || bookmark.uri);
            item.setAttribute('image', bookmark.icon);
            item.setAttribute('tooltiptext', bookmark.uri);
            
            item.addEventListener('dblclick', self.openUri.bind(self, bookmark.uri), true);
            
            container.appendChild(item);
        }
    };
    
    this.loadTabs = function() {
        
        let container = self.document.getElementById('tabs_content');
        while(container.hasChildNodes())
            container.removeChild(container.lastChild);
        
        let tabs = self.launcher.tabs;
        for(let i=0; i<tabs.length; i++) {
            let tab = tabs[i];
            
            let item = self.document.createElement('listitem');
            item.setAttribute('class', 'listitem-iconic');
            item.setAttribute('label', tab.label);
            item.setAttribute('image', tab.getAttribute('image'));
            
            item.addEventListener('dblclick', self.openTab.bind(self, tab), true);
            
            container.appendChild(item);
        }
    };
    
    this.openUri = function(aUri) {
        gBrowser.selectedTab = gBrowser.loadOneTab(aUri);
    };
    
    this.openTab = function(aTab) {
        gBrowser.selectedTab = aTab;
    };
    
    
    this.onPageLoad = function(aEvent) {
        let doc = aEvent.originalTarget; // doc is document that triggered
                                            // "onload" event
        if(doc.location.href != 'chrome://booky/content/launcher/details.xul')
            return;
        
        // Don't need to listen for load anymore
        document.getElementById('appcontent').removeEventListener('DOMContentLoaded', this.onPageLoad);
        
        self.document = doc;
        self.setupListeners();
        self.setupPage();
        self.loading = false;
        

// self.document.defaultView.addEventListener("unload", function(event){
// self.onPageUnload(event); }, true);
    };
    
    this.setupListeners = function() {
        
        let containerIds = ['tabs_content', 'history_content', 'bookmarks_content'];

        containerIds.forEach(function(id) { 
            self.document.getElementById(id).addEventListener('blur', self.containerBlur, false);
        });
    };
    
    this.containerBlur = function(aEvent) {
        aEvent.originalTarget.selectedIndex = -1;
    };
    
    this.setupPage = function() {
        self.loadHistory();
        self.loadBookmarks();
        self.loadTabs();
    };
    
// this.onPageUnload = function(aEvent) {
// dump("details page unloaded\n");
// };
    
   
    this.setup = function() {
        // Add the details page URI to the list of pages to set disablechrome on
        XULBrowserWindow.inContentWhitelist.push("chrome://booky/content/launcher/details.xul");
        gBrowser.tabContainer.addEventListener("TabSelect", self.tabselect, false);
    };
    
};

window.addEventListener("load", function() {
    com.sppad.booky.Details.setup();
}, false);