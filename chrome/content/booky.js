var com = com || {};
com.sppad = com.sppad || {};

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');

com.sppad.Booky = (function() {
    
    var _connectingString = null;
    var _newTabString = null;
    var _selectedTab = null;
    
    var bookmarkCount = 0;
    
    return {
        
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
            switch (aEvent.type)
            {
                case com.sppad.Bookmarks.EVENT_ADD_BOOKMARK:
                case com.sppad.Bookmarks.EVENT_LOAD_BOOKMARK:
                    return this.onBookmarkAdded(aEvent);
                case com.sppad.Bookmarks.EVENT_MOV_BOOKMARK:
                    return this.onBookmarkMoved(aEvent);
                case com.sppad.Bookmarks.EVENT_DEL_BOOKMARK:
                    return this.onBookmarkRemoved(aEvent);
                case com.sppad.TabEvents.EVENT_TAB_MOVED:
                    return this.onTabMove(aEvent.tab);
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
                case com.sppad.Preferences.EVENT_PREFERENCE_CHANGED:
                    return this.prefChanged(aEvent.name, aEvent.value);
                default:
                    return null;
            }
        },
        
        prefChanged: function(name, value) {  
            com.sppad.Utils.dump("pref change: " + name + " -> " + value + "\n");
              
            switch(name)
            { 
              case 'maxIcons':
              case 'maxWidth':
              case 'overflowMode':
                  com.sppad.Resizer.onResize();
                  break;
              case "debug":
                  com.sppad.Utils.enableDebug(value);
                  break;
              case "hideTabStrategy":
              case "grayoutInactiveIcons":
                  this.applyAttribute('TabsToolbar', name, value);
                  break;
              case "hideLauncherStrategy":
                  this.applyAttribute('TabsToolbar', name, value);
                  com.sppad.Resizer.onResize();
                  break;
              default:
                  break;
            }
        },
        
        applyAttribute: function(id, name, value) {
            document.getElementById(id).setAttribute("com_sppad_booky_" + name, value);
            // Force resize so things are hidden / shown appropriately.
            com.sppad.Resizer.onResize();
        },
        
        onBookmarkAdded: function(event) {
            let node = event.node;
            let id = this.getIdFromUriString(node.uri);
            
            let launcher = com.sppad.Launcher.getLauncher(id);
            launcher.addBookmark(node.uri, node.icon, node.itemId);
            
            // Add all existing tabs in the launcher
            let tabs = gBrowser.tabs;
            for(let i=0; i<tabs.length; i++)
                if(id == this.getIdFromTab(tabs[i]))
                    launcher.addTab(tabs[i]);
            
            this.updateBookmarksCount(1);
        },
        
        onBookmarkRemoved: function(event) {
            let node = event.node;
            // Need to lookup by the bookmark id because the uri of the boomark
            // may have changed (if it has been modified at not deleted).
            let launcher = com.sppad.Launcher.getLauncherFromBookmarkId(node.itemId);
       
            // Can occur due to how bookmarks are edited (at least on Linux)
            if(!launcher)
                return;
            
            launcher.removeBookmark(node.itemId);
            this.updateBookmarksCount(-1);
        },
        
        onBookmarkMoved: function(event) {
            let node = event.node;
            let nodeNext = event.nodeNext;
            
            let group = com.sppad.Launcher.getLauncher(this.getIdFromUriString(node.uri));
            let nextGroup = nodeNext ? com.sppad.Launcher.getLauncher(this.getIdFromUriString(nodeNext.uri)) : null;
            
            group.createBefore(nextGroup);
            
            // Force resize so things are hidden / shown appropriately.
            com.sppad.Resizer.onResize();
        },
        
        onTabMove: function(aTab) {
            com.sppad.Utils.dump('Tab moved\n');
        },
        
        onTabOpen: function(aTab) {
            this.onTabAttrChange(aTab);
        },
        
        onTabSelect: function(aTab) {
            if(_selectedTab.com_sppad_booky_launcher)
                _selectedTab.com_sppad_booky_launcher.updateTab(_selectedTab);
            
            if(aTab.com_sppad_booky_launcher)
                aTab.com_sppad_booky_launcher.updateTab(aTab);
            
            if(_selectedTab.com_sppad_booky_launcher || aTab.com_sppad_booky_launcher)
                com.sppad.Resizer.onTabSelect(aTab);
            
            _selectedTab = aTab;
        },
        
        onTabClose: function(aTab) {
            if(aTab.com_sppad_booky_launcher) {
                aTab.com_sppad_booky_launcher.removeTab(aTab);
                com.sppad.Resizer.onTabTitleChangeCleared(aTab);
                com.sppad.Resizer.onResize();
            }
        },
        
        onTabAttrChange: function(aTab) {
            let newId = this.getIdFromTab(aTab);
            let oldId = aTab.com_sppad_booky_id;
            
            // If the tab hasn't loaded yet, use the label for the id
            if(newId === "about:blank" && aTab.label != _newTabString && aTab.label != "")
                newId = this.getIdFromUriString(aTab.label);

            // Check to see if the tab needs to be removed from existing group
            // and/or added to a group
            if(aTab.label != _connectingString && newId != oldId) {
                if(aTab.com_sppad_booky_launcher)
                    aTab.com_sppad_booky_launcher.removeTab(aTab);
                
                if(com.sppad.Launcher.hasLauncher(newId))
                    com.sppad.Launcher.getLauncher(newId).addTab(aTab);
                
                aTab.com_sppad_booky_id = newId;
                
                // Adding / changing the launcher may cause the overflow
                // strategy to change whether one or more launchers do/do not
                // overflow.
                com.sppad.Resizer.onResize();
            }
            
            if(aTab.com_sppad_booky_launcher)
                aTab.com_sppad_booky_launcher.updateTab(aTab);
        },
        
        onTabTitleChange: function(aTab) {
            aTab.com_sppad_booky_titlechanged = true;
            if(aTab.com_sppad_booky_launcher) {
                aTab.com_sppad_booky_launcher.updateTab(aTab);
                com.sppad.Resizer.onTabTitleChange(aTab);
            }
        },
        
        onTabTitleChangeCleared: function(aTab) {
            aTab.com_sppad_booky_titlechanged = false;
            if(aTab.com_sppad_booky_launcher) {
                aTab.com_sppad_booky_launcher.updateTab(aTab);
                com.sppad.Resizer.onTabTitleChangeCleared(aTab);
            }
        },
        
        onTabUnread: function(aTab) {

        },
        
        onTabUnreadCleared: function(aTab) {

        },
        
        onTabBusy: function(aTab) {
            aTab.com_sppad_booky_busy = true;
            if(aTab.com_sppad_booky_launcher)
               aTab.com_sppad_booky_launcher.updateTab(aTab);
        },
        
        onTabBusyCleared: function(aTab) {
            aTab.com_sppad_booky_busy = false;
            if(aTab.com_sppad_booky_launcher)
                aTab.com_sppad_booky_launcher.updateTab(aTab);
        },
        
        loadPreferences: function() {
            this.prefChanged("debug", com.sppad.CurrentPrefs['debug']);
            this.prefChanged("hideTabStrategy", com.sppad.CurrentPrefs['hideTabStrategy']);
            this.prefChanged("hideLauncherStrategy", com.sppad.CurrentPrefs['hideLauncherStrategy']);
            this.prefChanged("grayoutInactiveIcons", com.sppad.CurrentPrefs['grayoutInactiveIcons']);
        }, 
        
        setup: function() {
            com.sppad.Preferences.addListener(this, com.sppad.Preferences.EVENT_PREFERENCE_CHANGED);
            this.loadPreferences();
            
            let tabStringBundle = window.document.getElementById("com_sppad_booky_tabstrings");
            _connectingString = tabStringBundle.getString("tabs.connecting");
            _newTabString = tabStringBundle.getString("tabs.emptyTabTitle");
            
            _selectedTab = gBrowser.selectedTab;
            
            com.sppad.TabEvents.addListener(this);
            com.sppad.Bookmarks.addListener(this);
            
            this.updateBookmarksCount(0);
            com.sppad.Bookmarks.loadBookmarks();
            this.loadTabs();
        },
        
        cleanup: function() {
            com.sppad.Preferences.removeListener(this, com.sppad.Preferences.EVENT_PREFERENCE_CHANGED);
            
            com.sppad.TabEvents.removeListener(this);
            com.sppad.Bookmarks.removeListener(this);
            
            com.sppad.TabEvents.cleanup();
        },
    }
})();

com.sppad.Booky.getIdFromTab = function(tab) {
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
};

com.sppad.Booky.getIdFromUriString = function(uriString) {
    try {
        return Services.io.newURI(uriString, null, null).host || uriString;
    } catch(err) {
        return uriString;
    }
};

com.sppad.Booky.waitForLoad = function() {
    
    // Keep waiting for Booky to load....
    // Not sure how to initialize while acting as a toolbaritem otherwise
    if(document.getElementById('com_sppad_booky_container')) {
        com.sppad.Resizer.setup();
        com.sppad.TabEvents.setup();
        com.sppad.DragDrop.setup();
        com.sppad.Booky.setup();
    }
    else {
        window.setTimeout(com.sppad.Booky.waitForLoad, 1000);
    }

};

window.addEventListener("load", function() {
    
    function installButton() {
        var id = "com_sppad_booky_container";
        var toolbar = document.getElementById('TabsToolbar');
        var anchor = document.getElementById('tabbrowser-tabs');

        toolbar.insertItem(id, anchor);
        toolbar.setAttribute("currentset", toolbar.currentSet);
        document.persist(toolbar.id, "currentset");
    }

    function firstRun(extensions) {
        if (extensions.get("booky@com.sppad").firstRun)
            installButton();
    }

    if (Application.extensions)
        firstRun(Application.extensions);
    else
        Application.getExtensions(firstRun);
    
    com.sppad.Booky.waitForLoad();
}, false);