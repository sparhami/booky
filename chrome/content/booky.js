var com = com || {};
com.sppad = com.sppad || {};

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');

com.sppad.TabDock = (function() {
    
    var bookmarkCount = 0;
    
    return {
        
        getIdFromTab: function(tab) {
            let currentUri = gBrowser.getBrowserForTab(tab).currentURI;
            
            try {
                return currentUri.host || currentUri.asciiSpec;
            } catch(err) {
                try {
                    return currentUri.asciiSpec;
                } catch(err) {
                    return tab.label;
                }
            }
        },

        getIdFromUriString: function(uriString) {
            try {
                return Services.io.newURI(uriString, null, null).host || uriString;
            } catch(err) {
                return uriString;
            }
        },
        
        loadTabs: function() {
            let container = gBrowser.tabContainer;
            for(let i = 0; i < container.itemCount; i++)
                this.onTabOpen(container.getItemAtIndex(i));
        },
        
        updateBookmarksCount: function(count) {
            bookmarkCount += count;
            document.getElementById('com_sppad_booky_container').setAttribute('bookmarkCount', bookmarkCount);
        },
        
        handleEvent : function(aEvent) {

            dump("handleEvent, aEvent.type: " + aEvent.type + "\n");
            
            switch (aEvent.type)
            {
                case com.sppad.Bookmarks.EVENT_ADD_BOOKMARK:
                case com.sppad.Bookmarks.EVENT_LOAD_BOOKMARK:
                    return this.onBookmarkAdded(aEvent);
                case com.sppad.Bookmarks.EVENT_MOV_BOOKMARK:
                    return this.onBookmarkMoved(aEvent);
                case com.sppad.Bookmarks.EVENT_DEL_BOOKMARK:
                    return this.onBookmarkRemoved(aEvent);
                case com.sppad.TabEvents.EVENT_TAB_OPENED:
                    return this.onTabOpen(aEvent.tab);
                case com.sppad.TabEvents.EVENT_TAB_SELECTED:
                    return this.onTabSelect(aEvent.tab);
                case com.sppad.TabEvents.EVENT_TAB_CLOSED:
                    return this.onTabClose(aEvent.tab);
                case com.sppad.TabEvents.EVENT_TAB_ATTR_CHANGED:
                    return this.onTabAttrChange(aEvent.tab);
                case com.sppad.TabEvents.EVENT_TAB_TITLE_CHANGED:
                    return this.onTabTitleChange(aEvent.tab);
                case com.sppad.TabEvents.EVENT_TAB_TITLE_CHANGED_CLEARED:
                    return this.onTabTitleChangeCleared(aEvent.tab);
                case com.sppad.TabEvents.EVENT_TAB_UNREAD:
                    return this.onTabUnread(aEvent.tab);
                case com.sppad.TabEvents.EVENT_TAB_UNREAD_CLEARED:
                    return this.onTabUnreadCleared(aEvent.tab);
                case com.sppad.TabEvents.EVENT_TAB_BUSY:
                    return this.onTabBusy(aEvent.tab);
                case com.sppad.TabEvents.EVENT_TAB_BUSY_CLEARED:
                    return this.onTabBusyCleared(aEvent.tab);
                default:
                    return null;
            }
        },
        
        onBookmarkAdded: function(event) {
            dump("onBookmarkAdded\n");
            let node = event.node;
            let id = this.getIdFromUriString(node.uri);
            
            dump("bookmark create id " + id +"\n");
            
            let launcher = com.sppad.Launcher.getLauncher(id);
            launcher.addBookmark(node.uri, node.icon);
            
            this.updateBookmarksCount(1);
            
            // node.itemId, node.uri, node.icon
        },
        
        onBookmarkRemoved: function(event) {
            dump("onBookmarkRemoved\n");
            
            let node = event.node;
            let uri = node.uri;
            
            this.updateBookmarksCount(-1);
            
            // node.itemId, node.uri, node.icon
        },
        
        onBookmarkMoved: function(event) {
            dump("onBookmarkMoved\n");
            
            let node = event.node;
            let uri = node.uri;
        },
        
        onTabOpen: function(aTab) {
            
            this.onTabAttrChange(aTab);
            dump("onTabOpen\n");
        },
        
        onTabSelect: function(aTab) {
            dump("onTabSelect\n");
        },
        
        onTabClose: function(aTab) {
            dump("onTabClose\n");
            
            if(aTab.com_sppad_booky_launcher)
                aTab.com_sppad_booky_launcher.removeTab(aTab);
        },
        
        onTabAttrChange: function(aTab) {
            dump("onTabAttrChange\n");
            
            let newId = this.getIdFromTab(aTab);
            let oldId = aTab.com_sppad_booky_id;
            
            let tabStringBundle = document.getElementById("com_sppad_booky_tabstrings");
            let newTabString = tabStringBundle.getString("tabs.emptyTabTitle");
            let connectingString = tabStringBundle.getString("tabs.connecting");
            
            // If the tab hasn't loaded yet, use the label for the id
            if(newId === "about:blank" && aTab.label != newTabString && aTab.label != "")
                newId = this.getIdFromUriString(aTab.label);

            // Check to see if the tab needs to be removed from existing group
            // and/or added to a group
            if(aTab.label != connectingString && newId != oldId) {
                if(aTab.com_sppad_booky_launcher)
                    aTab.com_sppad_booky_launcher.removeTab(aTab);
                if(com.sppad.Launcher.hasLauncher(newId))
                    com.sppad.Launcher.getLauncher(newId).addTab(aTab);
            }
            
            if(aTab.com_sppad_booky_launcher)
                aTab.com_sppad_booky_launcher.updateTab(aTab);
            
            aTab.com_sppad_booky_id = newId;   
        },
        
        onTabTitleChange: function(aTab) {
            dump("onTabTitleChange\n");
        },
        
        onTabTitleChangeCleared: function(aTab) {
            dump("onTabTitleChangeCleared\n");
        },
        
        onTabUnread: function(aTab) {
            dump("onTabUnread\n");
        },
        
        onTabUnreadCleared: function(aTab) {
            dump("onTabUnreadCleared\n");
        },
        
        onTabBusy: function(aTab) {
            dump("onTabBusy\n");
            
            aTab.com_sppad_booky_busy = true;
            if(aTab.com_sppad_booky_launcher)
               aTab.com_sppad_booky_launcher.updateTab(aTab);
        },
        
        onTabBusyCleared: function(aTab) {
            dump("onTabBusyCleared\n");
            
            aTab.com_sppad_booky_busy = false;
            if(aTab.com_sppad_booky_launcher)
                aTab.com_sppad_booky_launcher.updateTab(aTab);
        },
        
        loadPreferences: function() {
            this.prefChanged("debug", CurrentPrefs['debug']);
        }, 
        
        setup: function() {
            com.sppad.TabEvents.addListener(this);
            
            Preferences.addListener(this, Preferences.EVENT_PREFERENCE_CHANGED);
            com.sppad.Bookmarks.addListener(this, com.sppad.Bookmarks.EVENT_ADD_BOOKMARK);
            com.sppad.Bookmarks.addListener(this, com.sppad.Bookmarks.EVENT_MOV_BOOKMARK);
            com.sppad.Bookmarks.addListener(this, com.sppad.Bookmarks.EVENT_DEL_BOOKMARK);
            com.sppad.Bookmarks.addListener(this, com.sppad.Bookmarks.EVENT_LOAD_BOOKMARK);
            
            this.updateBookmarksCount(0);
            com.sppad.Bookmarks.loadBookmarks();
            this.loadTabs();
        },
        
        cleanup: function() {
            com.sppad.TabEvents.removeListener(this);
            
            Preferences.removeListener(this, Preferences.EVENT_PREFERENCE_CHANGED);
            com.sppad.Bookmarks.removeListener(this, com.sppad.Bookmarks.EVENT_ADD_BOOKMARK);
            com.sppad.Bookmarks.removeListener(this, com.sppad.Bookmarks.EVENT_MOV_BOOKMARK);
            com.sppad.Bookmarks.removeListener(this, com.sppad.Bookmarks.EVENT_DEL_BOOKMARK);
            com.sppad.Bookmarks.removeListener(this, com.sppad.Bookmarks.EVENT_LOAD_BOOKMARK);
            
            com.sppad.TabEvents.cleanup();
        },
    }
})();

window.addEventListener("load", function() {
    com.sppad.TabDock.setup();
}, false);
