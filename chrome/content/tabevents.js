var com = com || {};
com.sppad = com.sppad || {};

/**
 * Wrapper around browser tab events.
 */
com.sppad.TabEvents = (function() {
    
    /** For firing tab events */
    var _eventSupport = new com.sppad.EventSupport();
    
    /** Keeps track of the previous title for each tab */
    var _tabTitleMap = new WeakMap();
    
    /** The tabs that have a title changed event */
    var _tabTitleChangedMap = new WeakMap();
    
    /** All the tabs that are unread (really a set) */
    var _tabUnreadMap = new WeakMap();
    
    /** The tabs that are busy */
    var _tabBusyMap = new WeakMap();
    
    var _connectingString = null;
    
    /** Number of tabs that have a title change event */
    var titleChangedTabsCount = 0;
    
    /** Number of tabs that have an unread event */
    var unreadTabsCount = 0;
    
    /** Number of tabs that have a busy event */
    var busyTabsCount = 0;

    
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
            return _tabTitleChangedMap.has(aTab);
        },
        
        isUnread: function(aTab) {
            return _tabUnreadMap.has(aTab);
        },
        
        setTitleChange: function(aTab) {
            
            let oldLabel = _tabTitleMap.get(aTab);
            
            if(!aTab.selected
                && aTab.label != oldLabel
                && !_tabTitleChangedMap.has(aTab)
                && aTab.label != _connectingString
                && oldLabel != _connectingString
                && oldLabel != undefined)
            {
                titleChangedTabsCount++;
            
                _tabTitleChangedMap.set(aTab, "");
                _eventSupport.fire( { 'tab' : aTab }, this.EVENT_TAB_TITLE_CHANGED);
            }
            
        },
        
        clearTitleChange: function(aTab) {
            
            if(_tabTitleChangedMap.has(aTab)) {
                titleChangedTabsCount--;
                
                _tabTitleChangedMap.delete(aTab);
                _eventSupport.fire( { 'tab' : aTab }, this.EVENT_TAB_TITLE_CHANGED_CLEARED);
            }
            
        },
        
        setUnread: function(aTab) {
            
            if(!aTab.selected && !_tabUnreadMap.has(aTab)) {
                unreadTabsCount++;
                
                _tabUnreadMap.set(aTab, aTab.label);
                _eventSupport.fire( { 'tab' : aTab }, this.EVENT_TAB_UNREAD);
            }
            
        },
        
        clearUnread: function(aTab) {
            
            if(_tabUnreadMap.has(aTab)) {
                unreadTabsCount--;
                
                _tabUnreadMap.delete(aTab);
                _eventSupport.fire( { 'tab' : aTab }, this.EVENT_TAB_UNREAD_CLEARED);
            }
            
        },
        
        setBusy: function(aTab) {
            
            if(aTab.hasAttribute("busy") && !_tabBusyMap.has(aTab)) {
                busyTabsCount++;
                
                _tabBusyMap.set(aTab, aTab.label);
                _eventSupport.fire( { 'tab' : aTab }, this.EVENT_TAB_BUSY);
            }
            
        },
        
        clearBusy: function(aTab) {
            
            if(!aTab.hasAttribute("busy") && _tabBusyMap.has(aTab)) {
                busyTabsCount--;
                
                _tabBusyMap.delete(aTab);
                _eventSupport.fire( { 'tab' : aTab }, this.EVENT_TAB_BUSY_CLEARED);
            }
            
        },

        onTabAttrChange: function(aTab) {
            // ignore events on closed tabs
            if(aTab.closed)
                return;
          
            let oldLabel = _tabTitleMap.get(aTab);
            
            if(aTab.label != oldLabel) {
                _eventSupport.fire( { 'tab' : aTab }, this.EVENT_TAB_TITLE_UPDATED);
            }
            
            this.setBusy(aTab);
            this.clearBusy(aTab);
            this.setTitleChange(aTab);
            _tabTitleMap.set(aTab, aTab.label); 
            
            _eventSupport.fire( { 'tab' : aTab }, this.EVENT_TAB_ATTR_CHANGED);
        },
        
        onTabOpen: function(aTab) {
            _tabTitleMap.set(aTab, aTab.label);
            _eventSupport.fire( { 'tab' : aTab }, this.EVENT_TAB_OPENED);
            
            this.setUnread(aTab);
        },
        
        onTabMove: function(aTab) {
            _eventSupport.fire( { 'tab' : aTab }, this.EVENT_TAB_MOVED);
        },
        
        onTabSelect: function(aTab)  {
            // ignore events on closed tabs
            if(aTab.closed)
                return;
        
            this.clearUnread(aTab);
            this.clearTitleChange(aTab);
            
            _eventSupport.fire( { 'tab' : aTab }, this.EVENT_TAB_SELECTED);
        },
        
        onTabClose: function(aTab) {
            aTab.closed = true;
        
            this.clearBusy(aTab);
            this.clearUnread(aTab);
            this.clearTitleChange(aTab);
            
            _eventSupport.fire( { 'tab' : aTab }, this.EVENT_TAB_CLOSED);
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
            _connectingString = tabStringBundle.getString("tabs.connecting");
            
            let container = window.gBrowser.tabContainer;

            container.addEventListener("TabMove", this, false);  
            container.addEventListener("TabOpen", this, false);
            container.addEventListener("TabSelect", this, false);
            container.addEventListener("TabClose", this, false);
            container.addEventListener("TabAttrModified", this, false);
        },
        
        addListener: function(listener, type) { _eventSupport.addListener(listener, type); },
        removeListener: function(listener, type) { _eventSupport.removeListener(listener, type); },
    }
})();

window.addEventListener("load", function() {
    com.sppad.TabEvents.setup();
}, false);
