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
    
    this.showDetailsPage = function(aLauncher) {
        self.launcher = aLauncher;
        
        if(self.loading)
            return;
        
        self.loading = true;
        
        // Wait for page load to complete
        let appcontent = document.getElementById("appcontent");
        appcontent.addEventListener("DOMContentLoaded", this.onPageLoad, true);
        
        gBrowser.selectedTab = gBrowser.loadOneTab("chrome://booky/content/launcher/details.xul");
    };
    
    this.listBlur = function(aEvent) {
        
        
    };
    
    this.loadHistory = function() {
        
        let historyContainer = self.document.getElementById('com_sppad_booky_details_history_content');
        
        let numberOfDays = 365;
        let maxResults = 1000;
       
        let domains = self.launcher.getDomains();
        if(domains.length == 0)
            return;
        
        let results = com.sppad.booky.History.queryHistoryArray(domains, numberOfDays, maxResults);
        
        for(let i=0; i<results.length; i++) {
            let result = results[i];
            
            let item = self.document.createElement("listitem");
            item.setAttribute('class', 'listitem-iconic');
            item.setAttribute('label', result.title);
            item.setAttribute('image', result.icon);
            item.setAttribute('tooltiptext', result.uri);
            
            historyContainer.appendChild(item);
        }
    };
    
    this.loadBookmarks = function() {
        
        let bookmarksContainer = self.document.getElementById('com_sppad_booky_details_bookmarks_content');
        let bookmarks = self.launcher.bookmarksArray;
        for(let i=0; i<bookmarks.length; i++) {
            let bookmark = bookmarks[i];
            
            let item = self.document.createElement("listitem");
            item.setAttribute('class', 'listitem-iconic');
            item.setAttribute('label', bookmark.uri);
            item.setAttribute('image', bookmark.icon);
            item.setAttribute('tooltiptext', bookmark.uri);
            
            bookmarksContainer.appendChild(item);
        }
    };
    
    this.loadTabs = function() {
        
        let tabsContainer = self.document.getElementById('com_sppad_booky_details_tabs_content');
        let tabs = self.launcher.tabs;
        for(let i=0; i<tabs.length; i++) {
            let tab = tabs[i];
            
            let item = self.document.createElement("listitem");
            item.setAttribute('class', 'listitem-iconic');
            item.setAttribute('label', tab.label);
            item.setAttribute('image', tab.getAttribute('image'));
            
            tabsContainer.appendChild(item);
        }
    };
    
    this.onPageLoad = function(aEvent) {
        let doc = aEvent.originalTarget; // doc is document that triggered "onload" event
        if(doc.location.href != "chrome://booky/content/launcher/details.xul")
            return;
        
        self.document = doc;

        dump("details page loaded\n");

        self.loadHistory();
        self.loadBookmarks();
        self.loadTabs();
        self.loading = false;
        
        // Don't need to listen for load anymore
        let appcontent = document.getElementById("appcontent");
        appcontent.removeEventListener("DOMContentLoaded", this.onPageLoad);

        self.document.defaultView.addEventListener("unload", function(event){ self.onPageUnload(event); }, true);
    };
    
    this.onPageUnload = function(aEvent) {
        dump("details page unloaded\n");
    };
    
   
    this.setup = function() {
        // Add the details page URI to the list of pages to set disablechrome on
        XULBrowserWindow.inContentWhitelist.push("chrome://booky/content/launcher/details.xul");
    };
    
};

window.addEventListener("load", function() {
    com.sppad.booky.Details.setup();
}, false);