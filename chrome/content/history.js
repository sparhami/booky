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
     * Queries history for an array of hosts, returning the history results.
     * 
     * @param aHostArray
     *            An array of hosts to get history results for,
     * @param numberOfDays
     *            How many days in the past to search. Any value not greater
     *            than or equal to 0 will query all history.
     * @param maxResults
     *            The maximum number of results to return.
     * @param searchTerms
     *            The terms to search for.
     * 
     * @return An array of results, sorted by time.
     */
    this.queryHistoryArray = function(aHostArray, numberOfDays, maxResults, searchTerms) {
        
        let res = self.getQueries(aHostArray, numberOfDays, maxResults, searchTerms) ;
        let queryResult = self.hs.executeQueries(res.queries, res.queries.length, res.options);
        
        let resultArray = new Array();
        let container = queryResult.root;
        
        try {
            container.containerOpen = true;
            
            for (let i = 0; i < container.childCount; i ++)
                resultArray.push(container.getChild(i));
            
        } finally {
            container.containerOpen = false;
        }
        
        return resultArray;
    };
    
    /**
     * Gets the queries and options representing a history search for several
     * hosts.
     *
     * @param aHostArray
     *            An array of hosts to get history results for,
     * @param numberOfDays
     *            How many days in the past to search. Any value not greater
     *            than or equal to 0 will query all history.
     * @param maxResults
     *            The maximum number of results to return.
     * @param searchTerms
     *            The terms to search for.
     *            
     * @return { 'queries': an Array of queries, 'options': the options for the queries }
     */
    this.getQueries = function(aHostArray, numberOfDays, maxResults, searchTerms) {
        
        let options = self.hs.getNewQueryOptions();
        options.maxResults = maxResults;
        options.sortingMode = options.SORT_BY_DATE_DESCENDING;
        
        // Generate array of queries, one for each host
        let queries = new Array();
        for(let i=0; i<aHostArray.length; i++) {
            let query = self.hs.getNewQuery();
            query.searchTerms = searchTerms;
            
            if(numberOfDays >= 0) {
                // Search relative to now, numberOfDays in the past
                query.beginTimeReference = query.TIME_RELATIVE_NOW;
                query.beginTime = -1 * numberOfDays * DAY_IN_MICROSECONDS;
            } else {
                // Search from the beginning
                query.beginTimeReference = query.TIME_RELATIVE_EPOCH;
                query.beginTime = 0;
            }

            query.endTimeReference = query.TIME_RELATIVE_NOW;
            query.endTime = 0;

            query.domain = aHostArray[i];
            
            queries.push(query);
        }
        
        return { 'queries' : queries, 'options': options };
    };
    
    /**
     * Removes pages from the browser history.
     * 
     * @param aUriArray
     *            An array of URI strings to remove
     * @param length
     *            The length of aUriArray
     * 
     */
    this.removePagesByUris = function(aUriArray, length) {
        self.bh.removePages(aUriArray, length);
    };
    
    /**
     * Removes pages from the browser history based on hosts.
     * 
     * @param aHostArray
     *            An array of host strings to remove
     */
    this.removePagesByHosts = function(aHostArray) {       
        let length = aHostArray.length;
        for(let i=0; i<length; i++)
            self.bh.removePagesFromHost(aHostArray[i], false); 
    };
};