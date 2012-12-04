if (typeof com == "undefined") {
  var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

Components.utils.import("resource://gre/modules/Services.jsm");
Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');

com.sppad.booky.Booky = new function() {
    
    let self = this;
    
    self._connectingString = null;
    self._newTabString = null;
    self._selectedTab = null;
    
    self._bookmarkCount = 0;
    
    return {
        
        loadTabs: function() {
            let container = gBrowser.tabContainer;
            for(let i = 0; i < container.itemCount; i++)
                this.onTabOpen(container.getItemAtIndex(i));
        },
        
        updateBookmarksCount: function(count) {
            self._bookmarkCount += count;
            document.getElementById('com_sppad_booky_container').setAttribute('bookmarkCount', self._bookmarkCount);
        },
        
        handleEvent : function(aEvent) {
            switch (aEvent.type)
            {
                case com.sppad.booky.Bookmarks.EVENT_ADD_BOOKMARK:
                case com.sppad.booky.Bookmarks.EVENT_LOAD_BOOKMARK:
                    return this.onBookmarkAdded(aEvent);
                case com.sppad.booky.Bookmarks.EVENT_MOV_BOOKMARK:
                    return this.onBookmarkMoved(aEvent);
                case com.sppad.booky.Bookmarks.EVENT_DEL_BOOKMARK:
                    return this.onBookmarkRemoved(aEvent);
                case com.sppad.booky.TabEvents.EVENT_TAB_MOVED:
                    return this.onTabMove(aEvent.tab);
                case com.sppad.booky.TabEvents.EVENT_TAB_OPENED:
                    return this.onTabOpen(aEvent.tab);
                case com.sppad.booky.TabEvents.EVENT_TAB_SELECTED:
                    return this.onTabSelect(aEvent.tab);
                case com.sppad.booky.TabEvents.EVENT_TAB_CLOSED:
                    return this.onTabClose(aEvent.tab);
                case com.sppad.booky.TabEvents.EVENT_TAB_ATTR_CHANGED:
                    return this.onTabAttrChange(aEvent.tab);
                case com.sppad.booky.TabEvents.EVENT_TAB_TITLE_CHANGED:
                    return this.onTabTitleChange(aEvent.tab);
                case com.sppad.booky.TabEvents.EVENT_TAB_TITLE_CHANGED_CLEARED:
                    return this.onTabTitleChangeCleared(aEvent.tab);
                case com.sppad.booky.TabEvents.EVENT_TAB_UNREAD:
                    return this.onTabUnread(aEvent.tab);
                case com.sppad.booky.TabEvents.EVENT_TAB_UNREAD_CLEARED:
                    return this.onTabUnreadCleared(aEvent.tab);
                case com.sppad.booky.TabEvents.EVENT_TAB_BUSY:
                    return this.onTabBusy(aEvent.tab);
                case com.sppad.booky.TabEvents.EVENT_TAB_BUSY_CLEARED:
                    return this.onTabBusyCleared(aEvent.tab);
                case com.sppad.booky.Preferences.EVENT_PREFERENCE_CHANGED:
                    return this.prefChanged(aEvent.name, aEvent.value);
                default:
                    return null;
            }
        },
        
        prefChanged: function(name, value) {  
            com.sppad.booky.Utils.dump("pref change: " + name + " -> " + value + "\n");
              
            switch(name)
            { 
              case 'maxIcons':
              case 'maxWidth':
              case 'overflowMode':
                  com.sppad.booky.Resizer.onResize();
                  break;
              case "debug":
                  com.sppad.booky.Utils.enableDebug(value);
                  break;
              case "hideTabStrategy":
              case "grayoutInactiveIcons":
                  this.applyAttribute('TabsToolbar', name, value);
                  break;
              case "hideLauncherStrategy":
                  this.applyAttribute('TabsToolbar', name, value);
                  com.sppad.booky.Resizer.onResize();
                  break;
              default:
                  break;
            }
        },
        
        applyAttribute: function(id, name, value) {
            document.getElementById(id).setAttribute("com_sppad_booky_" + name, value);
            // Force resize so things are hidden / shown appropriately.
            com.sppad.booky.Resizer.onResize();
        },
        
        onBookmarkAdded: function(event) {
            let node = event.node;
            let id = this.getIdFromUriString(node.uri);
            
            let launcher = com.sppad.booky.Launcher.getLauncher(id);
            launcher.addBookmark(node.uri, node.icon, node.itemId);
            
            // Add all existing tabs in the launcher
            let tabs = gBrowser.tabs;
            for(let i=0; i<tabs.length; i++)
                if(id == this.getIdFromTab(tabs[i]))
                    launcher.addTab(tabs[i]);
            
            this.updateBookmarksCount(1);
            
            com.sppad.booky.Resizer.onResize();
        },
        
        onBookmarkRemoved: function(event) {
            let node = event.node;
            // Need to lookup by the bookmark id because the uri of the boomark
            // may have changed (if it has been modified at not deleted).
            let launcher = com.sppad.booky.Launcher.getLauncherFromBookmarkId(node.itemId);
       
            // Can occur due to how bookmarks are edited (at least on Linux)
            if(!launcher)
                return;
            
            launcher.removeBookmark(node.itemId);
            this.updateBookmarksCount(-1);
            
            com.sppad.booky.Resizer.onResize();
        },
        
        onBookmarkMoved: function(event) {
            com.sppad.booky.Utils.dump('onBookmarkMoved\n');
            
            let node = event.node;
            let nodeNext = event.nodeNext;
            
            let group = com.sppad.booky.Launcher.getLauncher(this.getIdFromUriString(node.uri));
            let nextGroup = nodeNext ? com.sppad.booky.Launcher.getLauncher(this.getIdFromUriString(nodeNext.uri)) : null;
            
            group.createBefore(nextGroup);
            
            // Force resize so things are hidden / shown appropriately.
            com.sppad.booky.Resizer.onResize();
        },
        
        onTabMove: function(aTab) {
            com.sppad.booky.Utils.dump('onTabMove\n');
        },
        
        onTabOpen: function(aTab) {
            com.sppad.booky.Utils.dump('onTabOpen\n');
            this.onTabAttrChange(aTab);
        },
        
        onTabSelect: function(aTab) {
            if(self._selectedTab.com_sppad_booky_launcher)
                self._selectedTab.com_sppad_booky_launcher.updateTab(self._selectedTab);
            
            if(aTab.com_sppad_booky_launcher)
                aTab.com_sppad_booky_launcher.updateTab(aTab);
            
            if(self._selectedTab.com_sppad_booky_launcher || aTab.com_sppad_booky_launcher)
                com.sppad.booky.Resizer.onTabSelect(aTab);
            
            self._selectedTab = aTab;
        },
        
        onTabClose: function(aTab) {
            if(aTab.com_sppad_booky_launcher) {
                aTab.com_sppad_booky_launcher.removeTab(aTab);
                com.sppad.booky.Resizer.onTabTitleChangeCleared(aTab);
                com.sppad.booky.Resizer.onResize();
            }
        },
        
        onTabAttrChange: function(aTab) {
            let newId = this.getIdFromTab(aTab);
            let oldId = aTab.com_sppad_booky_id;
            
            // If the tab hasn't loaded yet, use the label for the id
            if(newId === "about:blank" && aTab.label != self._newTabString && aTab.label != "")
                newId = this.getIdFromUriString(aTab.label);

            // Check to see if the tab needs to be removed from existing group
            // and/or added to a group
            if(aTab.label != self._connectingString && (newId != oldId || !aTab.com_sppad_booky_launcher)) {
                if(aTab.com_sppad_booky_launcher)
                    aTab.com_sppad_booky_launcher.removeTab(aTab);
                
                if(com.sppad.booky.Launcher.hasLauncher(newId))
                    com.sppad.booky.Launcher.getLauncher(newId).addTab(aTab);
                
                aTab.com_sppad_booky_id = newId;
                
                // Adding / changing the launcher may cause the overflow
                // strategy to change whether one or more launchers do/do not
                // overflow.
                com.sppad.booky.Resizer.onResize();
            }
            
            if(aTab.com_sppad_booky_launcher)
                aTab.com_sppad_booky_launcher.updateTab(aTab);
        },
        
        onTabTitleChange: function(aTab) {
            aTab.com_sppad_booky_titlechanged = true;
            if(aTab.com_sppad_booky_launcher) {
                aTab.com_sppad_booky_launcher.updateTab(aTab);
                com.sppad.booky.Resizer.onTabTitleChange(aTab);
            }
        },
        
        onTabTitleChangeCleared: function(aTab) {
            aTab.com_sppad_booky_titlechanged = false;
            if(aTab.com_sppad_booky_launcher) {
                aTab.com_sppad_booky_launcher.updateTab(aTab);
                com.sppad.booky.Resizer.onTabTitleChangeCleared(aTab);
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
            this.prefChanged("debug", com.sppad.booky.CurrentPrefs['debug']);
            this.prefChanged("hideTabStrategy", com.sppad.booky.CurrentPrefs['hideTabStrategy']);
            this.prefChanged("hideLauncherStrategy", com.sppad.booky.CurrentPrefs['hideLauncherStrategy']);
            this.prefChanged("grayoutInactiveIcons", com.sppad.booky.CurrentPrefs['grayoutInactiveIcons']);
        }, 
        
        setup: function() {
            com.sppad.booky.Preferences.addListener(this, com.sppad.booky.Preferences.EVENT_PREFERENCE_CHANGED);
            this.loadPreferences();
            
            let tabStringBundle = window.document.getElementById("com_sppad_booky_tabstrings");
            self._connectingString = tabStringBundle.getString("tabs.connecting");
            self._newTabString = tabStringBundle.getString("tabs.emptyTabTitle");
            
            self._selectedTab = gBrowser.selectedTab;
            
            com.sppad.booky.TabEvents.addListener(this);
            com.sppad.booky.Bookmarks.addListener(this);
            
            this.updateBookmarksCount(0);
            com.sppad.booky.Bookmarks.loadBookmarks();
            this.loadTabs();
        },
        
        cleanup: function() {
            com.sppad.booky.Preferences.removeListener(this, com.sppad.booky.Preferences.EVENT_PREFERENCE_CHANGED);
            
            com.sppad.booky.TabEvents.removeListener(this);
            com.sppad.booky.Bookmarks.removeListener(this);
            
            com.sppad.booky.TabEvents.cleanup();
        },
    }
};

com.sppad.booky.Booky.getIdFromTab = function(tab) {
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

com.sppad.booky.Booky.getIdFromUriString = function(uriString) {
    try {
        return Services.io.newURI(uriString, null, null).host || uriString;
    } catch(err) {
        return uriString;
    }
};

com.sppad.booky.Booky.waitForLoad = function() {
    
    // Keep waiting for Booky to load....
    // Not sure how to initialize while acting as a toolbaritem otherwise
    if(document.getElementById('com_sppad_booky_container')) {
        com.sppad.booky.Resizer.setup();
        com.sppad.booky.TabEvents.setup();
        com.sppad.booky.DragDrop.setup();
        com.sppad.booky.Booky.setup();
    }
    else {
        window.setTimeout( function() { com.sppad.booky.Booky.waitForLoad(); } , 1000);
    }
};

window.addEventListener("load", function() {
    
    function installButton() {
        let id = "com_sppad_booky_container";
        let toolbar = document.getElementById('TabsToolbar');
        let anchor = document.getElementById('tabbrowser-tabs');

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
    
    com.sppad.booky.Booky.waitForLoad();
}, false);