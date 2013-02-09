if (typeof com == "undefined") {
  var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

com.sppad.booky.HistoryView = new function() {
    
    const MICROSECONDS_PER_MILLISECOND = 1000;
    const DAY_IN_MICROSECONDS = 24 * 60 * 60 * 1000000;
    
    var self = this;
    self.titles = [ "Last day",
                    "Last two days",
                    "Last 7 days",
                    "Last 30 days",
                    "More than 30 days" ];
    
    self.dividers = null;
    
    this.setup = function(aDocument, aLauncher) {
        self.document = aDocument;
        self.launcher = aLauncher;
        
        self.strings = aDocument.getElementById("com_sppad_booky_addonstrings");
        
        self.container = aDocument.getElementById('history_content');
        self.container.addEventListener('blur', self.containerBlur, false);
        self.container.addEventListener('keyup', self.keyEvent, false);
        self.container.addEventListener('select', self.select, false);
        
        self.context = aDocument.getElementById('history_context');
        self.context.js = self;
        
        aDocument.getElementById('history_clear').addEventListener('command', self.onDeleteAll, false);
    };
    
    this.loadItems = function() {
        
        while(self.container.hasChildNodes())
            self.container.removeChild(self.container.lastChild);
        
        let numberOfDays = 365;
        let maxResults = 1000;
       
        let domains = self.launcher.getDomains();
        if(domains.length == 0)
            return;

        let now = Date.now() * MICROSECONDS_PER_MILLISECOND;
        let results = com.sppad.booky.History.queryHistoryArray(domains, numberOfDays, maxResults);
        
        groupings = [ now,
                      now - DAY_IN_MICROSECONDS,
                      now - 2*DAY_IN_MICROSECONDS,
                      now - 7*DAY_IN_MICROSECONDS,
                      now - 30*DAY_IN_MICROSECONDS ];
        
        self.dividers = [];
        
        let di = 0; // divider index
        for(let i=0; i<results.length; i++) {
            let result = results[i];
            
            while(di <= groupings.length && result.time < groupings[di])
                self.container.appendChild(self.createDivider(di++));
            
            self.container.appendChild(self.createItem(result, i));
        }
        
        self.removeEmptyDividers();
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
    
    this.containerBlur = function() {
        self.container.selectedIndex = -1;
    };
    
    this.select = function() {
        let latestItem = self.container.selectedItems[self.container.selectedCount - 1];
        latestItem.divider && self.container.selectedItems.pop();
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

        if(!window.confirm(self.strings.getString("booky.historyClearConfirmation")))
            return;
        
        let hosts = self.launcher.getDomains();
        com.sppad.booky.History.removePagesByHosts(hosts);
        
        self.loadItems();
    };
    
    this.keyEvent = function(aEvent) {
        
        switch(aEvent.keyCode) {
            case KeyEvent.DOM_VK_RETURN:
                self.onAction();
                break;
            case KeyEvent.DOM_VK_DELETE:
                self.onDelete();
                break;
            case KeyEvent.DOM_VK_ESCAPE:
                self.containerBlur();
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