if (typeof com == "undefined") {
  var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

/**
 * Wrapper around browser tab events.
 */
com.sppad.booky.TabEvents = new function() {
    
    let self = this;
    
    /** For firing tab events */
    self._eventSupport = new com.sppad.booky.EventSupport();
    
    /** Keeps track of the previous title for each tab */
    self._tabTitleMap = new WeakMap();
    
    /** The tabs that have a title changed event */
    self._tabTitleChangedMap = new WeakMap();
    
    /** All the tabs that are unread (really a set) */
    self._tabUnreadMap = new WeakMap();
    
    /** The tabs that are busy */
    self._tabBusyMap = new WeakMap();
    
    self._connectingString = null;
    
    /** Number of tabs that have a title change event */
    self._titleChangedTabsCount = 0;
    
    /** Number of tabs that have an unread event */
    self._unreadTabsCount = 0;
    
    /** Number of tabs that have a busy event */
    self._busyTabsCount = 0;
    
    /** The tab events to listen for */
    self._tabEvents = ['TabMove', 'TabOpen', 'TabSelect', 'TabClose', 'TabAttrModified'];

    return {
        EVENT_TAB_MOVED: 'EVENT_TAB_MOVED',
        EVENT_TAB_OPENED: 'EVENT_TAB_OPENED',
        EVENT_TAB_CLOSED: 'EVENT_TAB_CLOSED',
        EVENT_TAB_SELECTED: 'EVENT_TAB_SELECTED',
        EVENT_TAB_ATTR_CHANGED: 'EVENT_TAB_ATTR_CHANGED',
        EVENT_TAB_TITLE_UPDATED: 'EVENT_TAB_TITLE_UPDATED',
        EVENT_TAB_TITLE_CHANGED: 'EVENT_TAB_TITLE_CHANGED',
        EVENT_TAB_TITLE_CHANGED_CLEARED: 'EVENT_TAB_TITLE_CHANGED_CLEARED',
        EVENT_TAB_UNREAD: 'EVENT_TAB_UNREAD',
        EVENT_TAB_UNREAD_CLEARED: 'EVENT_TAB_UNREAD_CLEARED',
        EVENT_TAB_BUSY: 'EVENT_TAB_BUSY',
        EVENT_TAB_BUSY_CLEARED: 'EVENT_TAB_BUSY_CLEARED',
        
        isTitleChanged: function(aTab) {
            return self._tabTitleChangedMap.has(aTab);
        },
        
        isUnread: function(aTab) {
            return self._tabUnreadMap.has(aTab);
        },
        
        setTitleChange: function(aTab) {
            
            let oldLabel = self._tabTitleMap.get(aTab);
            
            if(!aTab.selected
                && aTab.label != oldLabel
                && !self._tabTitleChangedMap.has(aTab)
                && aTab.label != self._connectingString
                && oldLabel != self._connectingString
                && oldLabel != undefined)
            {
                self._titleChangedTabsCount++;
            
                self._tabTitleChangedMap.set(aTab, "");
                self._eventSupport.fire( { 'tab' : aTab }, this.EVENT_TAB_TITLE_CHANGED);
            }
            
        },
        
        clearTitleChange: function(aTab) {
            
            if(self._tabTitleChangedMap.has(aTab)) {
                self._titleChangedTabsCount--;
                
                self._tabTitleChangedMap.delete(aTab);
                self._eventSupport.fire( { 'tab' : aTab }, this.EVENT_TAB_TITLE_CHANGED_CLEARED);
            }
            
        },
        
        setUnread: function(aTab) {
            
            if(!aTab.selected && !self._tabUnreadMap.has(aTab)) {
                self._unreadTabsCount++;
                
                self._tabUnreadMap.set(aTab, aTab.label);
                self._eventSupport.fire( { 'tab' : aTab }, this.EVENT_TAB_UNREAD);
            }
            
        },
        
        clearUnread: function(aTab) {
            
            if(self._tabUnreadMap.has(aTab)) {
                self._unreadTabsCount--;
                
                self._tabUnreadMap.delete(aTab);
                self._eventSupport.fire( { 'tab' : aTab }, this.EVENT_TAB_UNREAD_CLEARED);
            }
            
        },
        
        setBusy: function(aTab) {
            
            if(aTab.hasAttribute("busy") && !self._tabBusyMap.has(aTab)) {
                self._busyTabsCount++;
                
                self._tabBusyMap.set(aTab, aTab.label);
                self._eventSupport.fire( { 'tab' : aTab }, this.EVENT_TAB_BUSY);
            }
            
        },
        
        clearBusy: function(aTab) {
            
            if(!aTab.hasAttribute("busy") && self._tabBusyMap.has(aTab)) {
                self._busyTabsCount--;
                
                self._tabBusyMap.delete(aTab);
                self._eventSupport.fire( { 'tab' : aTab }, this.EVENT_TAB_BUSY_CLEARED);
            }
            
        },

        onTabAttrChange: function(aTab) {
            // ignore events on closed tabs
            if(aTab.closed)
                return;
          
            let oldLabel = self._tabTitleMap.get(aTab);
            
            if(aTab.label != oldLabel) {
                self._eventSupport.fire( { 'tab' : aTab }, this.EVENT_TAB_TITLE_UPDATED);
            }
            
            this.setBusy(aTab);
            this.clearBusy(aTab);
            this.setTitleChange(aTab);
            self._tabTitleMap.set(aTab, aTab.label); 
            
            self._eventSupport.fire( { 'tab' : aTab }, this.EVENT_TAB_ATTR_CHANGED);
        },
        
        onTabOpen: function(aTab) {
            self._tabTitleMap.set(aTab, aTab.label);
            self._eventSupport.fire( { 'tab' : aTab }, this.EVENT_TAB_OPENED);
            
            this.setUnread(aTab);
        },
        
        onTabMove: function(aTab) {
            self._eventSupport.fire( { 'tab' : aTab }, this.EVENT_TAB_MOVED);
        },
        
        onTabSelect: function(aTab)  {
            // ignore events on closed tabs
            if(aTab.closed)
                return;
        
            this.clearUnread(aTab);
            this.clearTitleChange(aTab);
            
            self._eventSupport.fire( { 'tab' : aTab }, this.EVENT_TAB_SELECTED);
        },
        
        onTabClose: function(aTab) {
            aTab.closed = true;
        
            this.clearBusy(aTab);
            this.clearUnread(aTab);
            this.clearTitleChange(aTab);
            
            self._eventSupport.fire( { 'tab' : aTab }, this.EVENT_TAB_CLOSED);
        },
        
        handleEvent: function(aEvent) {

            switch (aEvent.type)
            {
                case "TabOpen":
                    return this.onTabOpen(aEvent.target);
                case "TabMove":
                    return this.onTabMove(aEvent.target);
                case "TabSelect":
                    return this.onTabSelect(aEvent.target);
                case "TabClose":
                    return this.onTabClose(aEvent.target);
                case "TabAttrModified":
                    return this.onTabAttrChange(aEvent.target);
                default:
                    return null;
            }
        },
        
        setup: function() {
            let tabStringBundle = window.document.getElementById("com_sppad_booky_tabstrings");
            self._connectingString = tabStringBundle.getString("tabs.connecting");
            
            self._tabEvents.forEach(function(eventName) {
                window.gBrowser.tabContainer.addEventListener(eventName, this, false);
            }.bind(this));
        },
        
        cleanup: function() {
            self._tabEvents.forEach(function(eventName) {
                window.gBrowser.tabContainer.removeEventListener(eventName, this);
            }.bind(this)); 
        },
        
        addListener: function(listener, type) { self._eventSupport.addListener(listener, type); },
        removeListener: function(listener, type) { self._eventSupport.removeListener(listener, type); },
    }
};