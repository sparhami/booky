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
        self.historyResults = results;
        
        for(let i=0; i<results.length; i++) {
            let result = results[i];
            
            let item = self.document.createElement('listitem');
            item.setAttribute('class', 'listitem-iconic');
            item.setAttribute('label', result.title);
            item.setAttribute('image', result.icon);
            item.setAttribute('tooltiptext', result.uri);
            
            item.addEventListener('dblclick', self.onAction.bind(self, container, i), true);
            
            container.appendChild(item);
        }
    };
    
    this.loadBookmarks = function() {
        
        let container = self.document.getElementById('bookmarks_content');
        while(container.hasChildNodes())
            container.removeChild(container.lastChild);
        
        let bookmarks = self.launcher.bookmarks;
        for(let i=0; i<bookmarks.length; i++) {
            let bookmark = bookmarks[i];
            
            let item = self.document.createElement('listitem');
            item.setAttribute('class', 'listitem-iconic');
            item.setAttribute('label', bookmark.title || bookmark.uri);
            item.setAttribute('image', bookmark.icon);
            item.setAttribute('tooltiptext', bookmark.uri);
            
            item.addEventListener('dblclick', self.onAction.bind(self, container, i), true);
            
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
            
            item.addEventListener('dblclick', self.onAction.bind(self, container, i), true);
            
            container.appendChild(item);
        }
    };
    
    this.openUri = function(aUri) {
        gBrowser.selectedTab = gBrowser.loadOneTab(aUri);
    };
    
    this.openTab = function(aTab) {
        gBrowser.selectedTab = aTab;
    };
    
    this.closeTab = function(aTab) {
        gBrowser.removeTab(aTab);
    };
    
    this.onPageLoad = function(aEvent) {
        let doc = aEvent.originalTarget;
        if(doc.location.href != 'chrome://booky/content/launcher/details.xul')
            return;
        
        gBrowser.tabContainer.addEventListener("TabSelect", self.tabselect, false);
        
        // Don't need to listen for load anymore
        document.getElementById('appcontent').removeEventListener('DOMContentLoaded', this.onPageLoad);
        
        self.document = doc;
        self.setupListeners();
        self.setupPage();
        self.loading = false;
        

        doc.defaultView.addEventListener("unload", function(event){ self.onPageUnload(event); }, true);
    };
    
    this.onPageUnload = function(aEvent) {
        dump("details page unloaded\n");
        gBrowser.tabContainer.removeEventListener("TabSelect", self.tabselect);
    };
    
    this.setupListeners = function() {
        
        let containerIds = ['tabs_content', 'history_content', 'bookmarks_content'];

        containerIds.forEach(function(id) {
            let container = self.document.getElementById(id);
            
            container.addEventListener('blur', self.containerBlur, false);
            container.addEventListener('keyup', self.keyEvent, false);
        });
    };
    
    this.containerBlur = function(aEvent) {
        aEvent.originalTarget.selectedIndex = -1;
    };
    
    this.onAction = function(aContainer, aIndex) {
        if(aIndex == undefined && aContainer.selectedCount != 1)
            return;
            
        let index = aIndex || aContainer.selectedIndex;
        switch(aContainer.id) {
            case 'tabs_content':
                gBrowser.selectedTab = self.launcher.tabs[index];
                break;
            case 'history_content':
                gBrowser.selectedTab = gBrowser.loadOneTab(self.historyResults[index].uri);
                break;
            case 'bookmarks_content':
                gBrowser.selectedTab = gBrowser.loadOneTab(self.launcher.bookmarks[index].uri);
                break;
        }
    };
    
    this.onDelete = function(aContainer) {

        switch(aContainer.id) {
            case 'tabs_content':
                // Copy so that removing doesn't change indexing
                let tabsCopy = [].concat(self.launcher.tabs);
                
                for(let i=0; i<aContainer.selectedItems.length; i++) {
                    let index = aContainer.getIndexOfItem(aContainer.selectedItems[i]);
                    gBrowser.removeTab(tabsCopy[index]);
                }
                
                this.loadTabs();
                break;
            case 'history_content':
                let toRemove = [];
                
                for(let i=0; i<aContainer.selectedItems.length; i++) {
                    let index = aContainer.getIndexOfItem(aContainer.selectedItems[i]);
                    let uri = Services.io.newURI(self.historyResults[index].uri, null, null);
                    toRemove.push(uri);
                }
                
                com.sppad.booky.History.removePages(toRemove, toRemove.length);
                
                this.loadHistory();
                break;
            case 'bookmarks_content':
                // Copy so that removing doesn't change indexing
                let bookmarksCopy = [].concat(self.launcher.bookmarks);
                
                for(let i=0; i<aContainer.selectedItems.length; i++) {
                    let index = aContainer.getIndexOfItem(aContainer.selectedItems[i]);
                    com.sppad.booky.Bookmarks.removeBookmark(bookmarksCopy[index].itemId);
                }
                   
                this.loadBookmarks();
                break;
        }
        
    };
    
    this.keyEvent = function(aEvent) {
        
        switch(aEvent.keyCode) {
            case KeyEvent.DOM_VK_RETURN:
                self.onAction(aEvent.originalTarget);
                break;
            case KeyEvent.DOM_VK_DELETE:
                self.onDelete(aEvent.originalTarget);
                break;
            default:
                break;
        }
        
    };
    
    this.setupPage = function() {
        self.loadHistory();
        self.loadBookmarks();
        self.loadTabs();
    };
    
    this.setup = function() {
        // Add the details page URI to the list of pages to set disablechrome on
        XULBrowserWindow.inContentWhitelist.push("chrome://booky/content/launcher/details.xul");
    };
    
};

window.addEventListener("load", function() {
    com.sppad.booky.Details.setup();
}, false);