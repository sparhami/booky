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
    
    self.bh = Components.classes["@mozilla.org/browser/nav-history-service;1"]
        .getService(Components.interfaces.nsIBrowserHistory);
    
    /**
     * Queries history for an array of domains, returning 
     * 
     * @param aDomainArray
     *            An array of domains to get history results for,
     * @param numberOfDays
     *            How many days in the past to search.
     * @param maxResults
     *            The maximum number of results to return.
     * 
     * @return An array of results, sorted by time.
     */
    this.queryHistoryArray = function(aDomainArray, numberOfDays, maxResults) {
        
        let options = self.hs.getNewQueryOptions();
        options.maxResults = maxResults;
        options.sortingMode = options.SORT_BY_DATE_DESCENDING;
        
        let queries = new Array();
        for(let i=0; i<aDomainArray.length; i++) {
            let query = self.hs.getNewQuery();
            query.beginTimeReference = query.TIME_RELATIVE_NOW;
            query.beginTime = -1 * numberOfDays * DAY_IN_MICROSECONDS;
            query.endTimeReference = query.TIME_RELATIVE_NOW;
            query.endTime = 0; // now
            query.domain = aDomainArray[i];
            
            queries.push(query);
        }
        
        // execute the query
        let queryResult = self.hs.executeQueries(queries, queries.length, options);
        
        let resultArray = new Array();
        let container = queryResult.root;
        
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
    };
    
    this.removePages = function(aUriArray, length) {
        self.bh.removePages(aUriArray, length);
    };
};