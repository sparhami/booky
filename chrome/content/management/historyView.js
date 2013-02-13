if (typeof com == "undefined") {
  var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};


Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');

com.sppad.booky.HistoryView = new function() {
    
    const MICROSECONDS_PER_MILLISECOND = 1000;
    const DAY_IN_MICROSECONDS = 24 * 60 * 60 * 1000000;
    
    var self = this;
    self.dividers = null;
    self.historyService = Components.classes["@mozilla.org/browser/nav-history-service;1"].getService(Components.interfaces.nsINavHistoryService);
    self.searchTerms = "";
    self.lastResultTime = 0;
    
    this.historyObserver = {
        onBeforeDeleteURI : function(aURI, aGUID) { },
        onBeginUpdateBatch : function() { },
        onClearHistory : function() { },
        onDeleteURI : function(aURI, aGUID) { },
        onDeleteVisits : function(aURI, aVisitTime, aGUID) { }, 
        onEndUpdateBatch : function() { },
        onPageChanged : function(aURI, aWhat, aValue) { },
        onPageExpired : function(aURI, aVisitTime, aWholeEntry) { },
        onTitleChanged : function(aURI, aPageTitle) { },
        onVisit : function(aURI, aVisitID, aTime, aSessionID, aReferringID, aTransitionType, aGUID, aAdded) { 
            
            let host = com.sppad.booky.Groups.getHostFromUri(aURI);
            let domains = self.launcher.getDomains();
            
            if(com.sppad.booky.Utils.getIndexInArray(domains, host) >= 0) {
                dump("new history item for this launcher\n");
            }
        },
        
        QueryInterface : XPCOMUtils.generateQI([Components.interfaces.nsINavHistoryObserver])  
    };
    
    this.setup = function(aWindow, aLauncher) {
        self.window = aWindow;
        self.document = aWindow.document;
        self.launcher = aLauncher;
        
        self.strings = self.document.getElementById("com_sppad_booky_addonstrings");
        self.titles = [ self.strings.getString("booky.last24Hr"),
                        self.strings.getString("booky.last48Hr"),
                        self.strings.getString("booky.last7Days"),
                        self.strings.getString("booky.last30Days"),
                        self.strings.getString("booky.greaterThan30Days") ];
        
        self.container = self.document.getElementById('history_content');
        self.container.addEventListener('blur', self.blur, false);
        self.container.addEventListener('keyup', self.keyup, false);
        self.container.addEventListener('select', self.select, false);
        self.container.addEventListener('scroll', self.scroll, false);
        
        self.context = self.document.getElementById('history_context');
        self.context.js = self;
        
        self.document.getElementById('history_clear').addEventListener('command', self.onDeleteAll, false);
        self.historyService.addObserver(self.historyObserver, false);
    };
    
    this.cleanup = function() {
        self.historyService.removeObserver(self.historyObserver);
    };
    
    this.loadItems = function(searchTerms) {
        
        self.searchTerms = searchTerms;
        self.lastResultTime = null;
        self.moreResults = true;
        
        while(self.container.hasChildNodes())
            self.container.removeChild(self.container.lastChild);
        
        self.queryMoreItems(searchTerms);
        
        self.removeEmptyDividers();
    };
    
    this.queryMoreItems = function(searchTerms) {
        let endTime = self.lastResultTime;
        dump("self.lastResultTime is " + self.lastResultTime + "\n");
        dump("self.moreResults  is " + self.moreResults  + "\n");
        
        if(!self.moreResults)
            return;
        
        let numberOfDays = -1;
        let maxResults = 40;
       
        let domains = self.launcher.getDomains();
        if(domains.length == 0)
            return;

        let now = Date.now() * MICROSECONDS_PER_MILLISECOND;
        let results = com.sppad.booky.History.queryHistoryArray(domains, numberOfDays, maxResults, searchTerms, endTime);
        
        groupings = [ now,
                      now - DAY_IN_MICROSECONDS,
                      now - 2*DAY_IN_MICROSECONDS,
                      now - 7*DAY_IN_MICROSECONDS,
                      now - 30*DAY_IN_MICROSECONDS ];
        
        self.dividers = [];
        
        let di = 0; // divider index
        for(let i=0; i<results.length; i++) {
            let result = results[i];
            
//            while(di <= groupings.length && result.time < groupings[di])
//                self.container.appendChild(self.createDivider(di++));
            
            self.container.appendChild(self.createItem(result, i));
        }
        
        self.lastResultTime = results[results.length - 1].time -1;
        self.moreResults = results.length == maxResults;
        
        if(!self.moreResults)
            self.container.appendChild(self.createNoMoreItems());
    };
    
    this.createItem = function(aResult, aIndex) {
        let item = self.document.createElement('listitem');
        item.result = aResult;
        item.setAttribute('class', 'listitem-iconic');
        item.setAttribute('label', aResult.title || aResult.uri);
        item.setAttribute('image', aResult.icon);
        item.setAttribute('tooltiptext', aResult.uri);
        
        item.addEventListener('dblclick', self.onAction.bind(self, aIndex), true);
        
        return item;
    };
    
    this.createDivider = function(aIndex) {
        let item = self.document.createElement('listitem');
        item.divider = true;
        item.setAttribute('class', 'listitem-iconic listdivider');
        item.setAttribute('label', self.titles[aIndex]);
        item.setAttribute('disabled', 'true');
        
        self.dividers.push(item);
        
        return item;
    };
    
    this.createNoMoreItems = function() {
        let item = self.document.createElement('listitem');
        item.divider = true;
        item.setAttribute('class', 'listitem-iconic listend');
        item.setAttribute('label', self.strings.getString("booky.historyEnd"));
        item.setAttribute('disabled', 'true');
        
        return item;
    };
    
    this.removeEmptyDividers = function() {
        let toRemove = [];
        
        for(let i=0; i<self.dividers.length - 1; i++) {
           if(self.dividers[i].nextSibling === self.dividers[i+1]) {
               self.container.removeChild(self.dividers[i]);
               toRemove.push(i);
           }
        }
           
        for(let i=toRemove.length - 1; i>=0; i--)
            self.dividers.splice(toRemove[i], 1);
    };
    
    this.openUri = function(aUri) {
        gBrowser.selectedTab = gBrowser.loadOneTab(aUri);
    };
    
    this.blur = function() {
        self.container.selectedIndex = -1;
    };
    
    this.select = function() {
        let latestItem = self.container.selectedItems[self.container.selectedCount - 1];
        latestItem.divider && self.container.selectedItems.pop();
    };
    
    this.scroll = function() {
        let index = self.container.getIndexOfFirstVisibleRow();
        if(self.container.itemCount - index < 40) {
            self.queryMoreItems(self.searchTerms);
        }
    };
    
    this.onAction = function(aIndex) {
        if(aIndex == undefined && self.container.selectedCount != 1)
            return;
            
        let index = aIndex || self.container.selectedIndex;
        let uri = self.container.getItemAtIndex(index).result.uri;
        gBrowser.selectedTab = gBrowser.loadOneTab(uri);
    };
    
    this.onDelete = function() {
        
        let uris = [];
        let items = [];
        
        let count = self.container.selectedItems.length;
        for(let i=0; i<count; i++) {
            let item = self.container.selectedItems[i];
            
            if(item.divider)
                continue;
            
            uris.push(Services.io.newURI(item.result.uri, null, null));
            items.push(item);
        }
        
        // No selected items
        if(items.length == 0)
            return;
        
        for(let i=0; i<items.length; i++)
            self.container.removeChild(items[i]);
        
        self.removeEmptyDividers();
        com.sppad.booky.History.removePagesByUris(uris, uris.length);
    };
    
    this.onDeleteAll = function() {

        if(!self.window.confirm(self.strings.getString("booky.historyClearConfirmation")))
            return;
        
        let hosts = self.launcher.getDomains();
        com.sppad.booky.History.removePagesByHosts(hosts);
        
        self.loadItems();
    };
    
    this.keyup = function(aEvent) {
        
        switch(aEvent.keyCode) {
            case KeyEvent.DOM_VK_RETURN:
                self.onAction();
                break;
            case KeyEvent.DOM_VK_DELETE:
                self.onDelete();
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
        removeItem.setAttribute('disabled', self.container.selectedCount == 0);
        
        let openItem = self.document.getElementById('history_context_open');
        openItem.setAttribute('disabled', self.container.selectedCount != 1);
    };
};