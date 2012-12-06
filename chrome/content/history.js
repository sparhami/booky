if (typeof com == "undefined") {
  var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');

com.sppad.booky.History = new function() {
    
    const DAY_IN_MICROSECONDS = 24 * 60 * 60 * 1000000;
    
    let self = this;
    
    self.hs = Components.classes["@mozilla.org/browser/nav-history-service;1"]
        .getService(Components.interfaces.nsINavHistoryService);
    
    this.queryHistory = function(domain, numberOfDays, maxResults) {
        
        let options = self.hs.getNewQueryOptions();
        options.maxResults = maxResults;
        
        let query = self.hs.getNewQuery();
        query.beginTimeReference = query.TIME_RELATIVE_NOW;
        query.beginTime = -1 * numberOfDays * DAY_IN_MICROSECONDS;
        query.endTimeReference = query.TIME_RELATIVE_NOW;
        query.endTime = 0; // now
        query.domain = domain;
        
        // execute the query
        let result = self.hs.executeQuery(query, options);
        let container = result.root;
        
        let resultArray = new Array();
        
        try {
            container.containerOpen = true;
            
            for (let i = 0; i < container.childCount; i ++) {
                let node = container.getChild(i);
                resultArray.push(node);
            }
        } finally {
            container.containerOpen = false;
        }
        
        return resultArray;
    }
    
    this.searchHistory = function(key) {
        
        toggleSidebar('viewHistorySidebar', true);
        
        window.setTimeout(function() {
            
            //HistorySidebarInit();
            //searchHistory(this.id);
        }, 100);
        
    }
    
};