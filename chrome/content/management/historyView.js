if (typeof com == "undefined") {
  var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

com.sppad.booky.HistoryView = new function() {
    
    var self = this;
    
    this.setup = function(aDocument) {
        self.document = aDocument;
        
        self.container = aDocument.getElementById('history_content');
        self.container.addEventListener('blur', self.containerBlur, false);
        self.container.addEventListener('keyup', self.keyEvent, false);
        
        self.context = aDocument.getElementById('history_context');
        self.context.js = self;
        
        aDocument.getElementById('history_clear').addEventListener('command', self.onDeleteAll, false);
    };
    
    this.setLauncher = function(aLauncher) {
        self.launcher = aLauncher;
    };
    
    this.loadItems = function() {
        
        while(self.container.hasChildNodes())
            self.container.removeChild(self.container.lastChild);
        
        let numberOfDays = 365;
        let maxResults = 1000;
       
        let domains = self.launcher.getDomains();
        if(domains.length == 0)
            return;
        
        let results = com.sppad.booky.History.queryHistoryArray(domains, numberOfDays, maxResults);
        
        for(let i=0; i<results.length; i++) {
            let result = results[i];
            
            let item = self.document.createElement('listitem');
            item.result = result;
            item.setAttribute('class', 'listitem-iconic');
            item.setAttribute('label', result.title);
            item.setAttribute('image', result.icon);
            item.setAttribute('tooltiptext', result.uri);
            
            item.addEventListener('dblclick', self.onAction.bind(self, i), true);
            
            self.container.appendChild(item);
        }
    };
    
    this.openUri = function(aUri) {
        gBrowser.selectedTab = gBrowser.loadOneTab(aUri);
    };
    
    this.containerBlur = function() {
        self.container.selectedIndex = -1;
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
            
            uris.push(Services.io.newURI(item.result.uri, null, null));
            items.push(item);
        }
        
        for(let i=0; i<items.length; i++)
            self.container.removeChild(items[i]);
        
        com.sppad.booky.History.removePagesByUris(uris, uris.length);
    };
    
    this.onDeleteAll = function() {
        let strings = document.getElementById("com_sppad_booky_addonstrings");
        if(!confirm(strings.getString("booky.historyClearConfirmation")))
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
    };
};