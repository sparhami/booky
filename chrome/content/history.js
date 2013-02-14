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
     * Queries history for an array of domains, returning the history results.
     * 
     * @param aDomainArray
     *            An array of domains to get history results for,
     * @param numberOfDays
     *            How many days in the past to search. Any value not greater
     *            than or equal to 0 will query all history.
     * @param maxResults
     *            The maximum number of results to return.
     * @param searchTerms
     *            The terms to search for.
     * @param endTime
     *            Where to stop for the most recent result. If not specified,
     *            everything up until the moment the query is executed is
     *            considered.
     * 
     * @return An array of results, sorted by time.
     */
    this.queryHistoryArray = function(aDomainArray, numberOfDays, maxResults, searchTerms) {
        
        let options = res = self.getQueries(aDomainArray, numberOfDays, maxResults, searchTerms) ;
        // execute the query
        let queryResult = self.hs.executeQueries(res.queries, res.queries.length, res.options);
        
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
    
 this.getQueries = function(aDomainArray, numberOfDays, maxResults, searchTerms) {
        
        let options = self.hs.getNewQueryOptions();
        options.maxResults = maxResults;
        options.sortingMode = options.SORT_BY_DATE_DESCENDING;
        
        let queries = new Array();
        for(let i=0; i<aDomainArray.length; i++) {
            let query = self.hs.getNewQuery();
            query.searchTerms = searchTerms;
            
            if(numberOfDays >= 0) {
                query.beginTimeReference = query.TIME_RELATIVE_NOW;
                query.beginTime = -1 * numberOfDays * DAY_IN_MICROSECONDS;
            } else {
                query.beginTimeReference = query.TIME_RELATIVE_EPOCH;
                query.beginTime = 0;
            }

            query.endTimeReference = query.TIME_RELATIVE_NOW;
            query.endTime = 0; // now

            query.domain = aDomainArray[i];
            
            queries.push(query);
        }
        
        return { 'queries' : queries, 'options': options };
    };
    
    this.removePagesByUris = function(aUriArray, length) {
        self.bh.removePages(aUriArray, length);
    };
    
    this.removePagesByHosts = function(aHostArray) {       
        let length = aHostArray.length;
        for(let i=0; i<length; i++)
            self.bh.removePagesFromHost(aHostArray[i], false); 
    };
};