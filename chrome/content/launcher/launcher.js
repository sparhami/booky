if (typeof com == "undefined") {
  var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

com.sppad.booky.Launcher = function(aID) {
    
    let overflowTemplateNode = document.getElementById('com_sppad_booky_launcher_overflow_item_template');
    
    let self = this;
    this.selected = false;
    this._selectedIndex = 0;
    this.tabsUpdateTime = 0;
    this.bookmarksUpdateTime = 0;
    this.id = aID;
    this.title = "";
    this.tabs = [];
    this.bookmarks = [];
    this.empty = true;
    this.node = document.createElement('launcher');
    this.menuNode = overflowTemplateNode.cloneNode(true);
    this.menuNode.removeAttribute('id');
    this.eventSupport = new com.sppad.booky.EventSupport();
    
    /*
     * This is needed to force close the overflow menu in some situations. The
     * issue is that the menu does not properly close, causing it to not show
     * when opened the next time.
     * 
     * TODO - Fix underlying issue.
     */
    this.forceCloseOverflowMenu = function() {
        let overflowButton = document.getElementById('com_sppad_booky_launchers_overflow_button');
        overflowButton.open = false;
    };
    
    this.openTab = function(aUri) {
        
        if(aUri)
            gBrowser.selectedTab = gBrowser.addTab(aUri);
        else if(this.bookmarks.length > 0)
            gBrowser.selectedTab = gBrowser.addTab(this.bookmarks[0].uri);
            
        this.forceCloseOverflowMenu();
    };       
    
    this.switchTo = function(openIfClosed, next, reverse) {
        
        if(openIfClosed && this.tabs.length == 0) {
            this.openTab();
        } else if(this.tabs.length > 0) {
            let direction = this.selected ? (next == true ? 1 : -1) : 0;
            let index = this.getNextIndex(direction, reverse);
            
            gBrowser.selectedTab = this.tabs[index];
        }
    };
    
    this.mod = function(n, m) {
        return ( ( n % m ) + m ) % m;
    };
    
    this.getNextIndex = function(direction, reverse) {
        let index = self._selectedIndex;
        let count = direction > 0 ? +1 :
                    direction < 0 ? -1 :
                    0;
        
        index += (reverse === true) ? 0 - count : count;
        return this.mod(index, this.tabs.length);
    };
    
    /**
     * Updates the attributes applied (busy, unread, selected, titlechanged,
     * label, hasSingle, hasMultiple to the DOM nodes for this launcher.
     * 
     * If any tab in the launcher the selected tab, then all tabs in the
     * launcher are set as being in the active group.
     */
    this.updateAttributes = function() {
        let busy = false;
        let unread = false;
        let selected = false;
        let titlechanged = false;
        
        for(let i=0; i<this.tabs.length; i++) {
            let tab = this.tabs[i];
            
            busy |= tab.com_sppad_booky_busy == true;
            unread |= tab.hasAttribute('unread');
            selected |= tab == gBrowser.selectedTab;
            titlechanged |= tab.com_sppad_booky_titlechanged == true;
            
            if(tab == gBrowser.selectedTab)
                self._selectedIndex = i;
        }
        
        for(let i=0; i<this.tabs.length; i++)
            this.tabs[i].setAttribute("com_sppad_booky_activeGroup", selected == true);
        
        this.selected = selected;
        
        this.setAttribute("busy", busy == true);
        this.setAttribute("unread", unread == true);
        this.setAttribute("selected", selected == true);
        this.setAttribute("titlechanged", titlechanged == true);
        
        this.setAttribute("hasSingle", this.tabs.length > 0);
        this.setAttribute("hasMultiple", this.tabs.length > 1);
        
        if(this.tabs.length == 0)
            this.setImage(this.bookmarks.length > 0 ? this.bookmarks[0].icon : null);
        else
            this.setImage(this.tabs[self._selectedIndex].image);
    };
    
    /**
     * Evaluates and shows the tab index indicator if the launcher is selected.
     */
    this.evaluateTabIndexIndicator = function() {
        if(self.selected && self.tabs.length > 1)
            com.sppad.booky.Launcher.showIndexIndicator((self._selectedIndex + 1) + "/" + this.tabs.length); 
        else
            com.sppad.booky.Launcher.hideIndexIndicator();
    };
    
    /**
     * Sets the disabled state for the items in the context / overflow menus.
     * 
     * @param rootNode
     *            The DOM node for the menu.
     */
    this.disableMenuItems = function(rootNode) {
        let items = [ 'launcher_menu_switchTo', 'launcher_menu_close', 'launcher_menu_reload'];
        
        items.forEach(function(item) {
            let node = document.getAnonymousElementByAttribute(rootNode, 'class', item);
        
            if(self.tabs.length == 0)
                node.setAttribute('disabled', 'true');
            else
                node.removeAttribute('disabled');
        });
    };
    
    /**
     * Sets an attribute for this launcher, applying it to both the launcher
     * node and overflow menu node.
     * 
     * @param attrName
     *            The name of the attribute.
     * @param attrValue
     *            The value of the attribute.
     */
    this.setAttribute = function(attrName, attrValue) {
        this.node.setAttribute(attrName, attrValue);
        this.menuNode.setAttribute(attrName, attrValue);
    };

    /**
     * Sets the image for the launcher or the default icon if none is specified.
     * 
     * @param anImage
     *            The URI for the image to set as the launcher icon
     */
    this.setImage = function(anImage) {
        this.setAttribute('image', anImage || 'chrome://mozapps/skin/places/defaultFavicon.png');
    };
    
    this.setTitle = function(aTitle) {
        this.title = aTitle;
        
        let label = aTitle;
        if(!label) {
            let domains = this.getDomains();
            label = (domains.length == 1) ? domains[0] : "(no title)";
        }
        
        this.setAttribute('label', label);
    };
    
    /**
     * Gets all the hostnames represented by the bookmarks in this launcher.
     * 
     * @return An array of the hostnames associated with this launcher.
     */
    this.getDomains = function() {
        let domainsSet = new Set();
        for(let i=0; i<this.bookmarks.length; i++) {
            let uriString = this.bookmarks[i].uri;
            let host = com.sppad.booky.Groups.getHostFromUriString(uriString);
            domainsSet.add(host);
        }

        return [v for (v of domainsSet)];
    };
    
    /**
     * Sets the ordinal on the launcher node. Note that it does not set it on
     * the overflow node as that appears to be rather buggy at the moment.
     * 
     * @param ordinal
     *            The ordinal of the launcher
     */
    this.setOrdinal = function(ordinal) {
        this.node.setAttribute('ordinal', ordinal);
    };
    
    this.placeTab = function(aTab, launcherMoving) {
        /*
         * Insert after all tabs in the specified node. If launcher is not
         * moving and has any tabs, insert after all existing tabs in the
         * launcher. Otherwise, find the previous launcher with tabs open.
         */
        let node = this.node;
        if(launcherMoving || this.tabs.length <= 1) {
            do {
                node = node.previousSibling;
            } while(node != null && node.js.tabs.length == 0);
        }
        
        let index = 0;
        let currentIndex = 0;
        let tabs = gBrowser.tabs;
        
        // Get the index of the last tab belonging to the node.
        if(node)
            for(let i = 0; i < tabs.length; i++)
                if(tabs[i] == aTab)
                    currentIndex = i;
                else if(tabs[i].com_sppad_booky_launcherId === node.js.id)
                    index = i + 1;
          
        // Need to offset by 1 since the tab is giving up its existing spot
        if(currentIndex < index)
            index--;
            
        gBrowser.moveTabTo(aTab, index);
    };
    
    /**
     * Adds a tab to the launcher.
     * 
     * @param aTab
     *            The tab to add
     */
    this.addTab = function(aTab) {
        this.addTabArray( [aTab] );
    };
    
    this.addTabArray = function(aTabArray) {
        this.tabsUpdateTime = Date.now();
        
        for(let i=0; i<aTabArray.length; i++) {
            let tab = aTabArray[i];
            
            if(tab.com_sppad_booky_launcher === this)
                continue;
            
            this.tabs.push(tab);
            tab.com_sppad_booky_launcher = this;
            tab.com_sppad_booky_launcherId = this.id;
            tab.setAttribute('com_sppad_booky_hasLauncher', true);
            this.placeTab(tab, false);
        }
        
        this.updateAttributes();
        this.evaluateTabIndexIndicator();
        this.eventSupport.fire( {}, this.TABS_ADDED);
    }
    
    /**
     * Removes a tab from the launcher.
     * 
     * @param aTab
     *            The tab to remove
     */
    this.removeTab = function(aTab) {
        this.removeTabArray( [aTab] );
    };
    
    this.removeTabArray = function(aTabArray) {
        this.tabsUpdateTime = Date.now();
        
        for(let i=0; i<aTabArray.length; i++) {
            let tab = aTabArray[i];
            
            if(tab.com_sppad_booky_launcher !== this)
                continue;
            
            com.sppad.booky.Utils.removeFromArray(this.tabs, tab);
            delete tab.com_sppad_booky_launcher;
            delete tab.com_sppad_booky_launcherId;
            tab.removeAttribute('com_sppad_booky_hasLauncher');
        }
        
        self._selectedIndex = Math.min(self._selectedIndex, this.tabs.length - 1);
        
        this.updateAttributes();
        this.evaluateTabIndexIndicator();
        this.eventSupport.fire( {}, this.TABS_REMOVED );
    };
    
    this.moveTab = function(aTab) {
        this.eventSupport.fire( {}, this.TABS_MOVED );  
    };
    
    this.setBookmarks = function(aBookmarkArray) {
        this.bookmarksUpdateTime = Date.now();
        this.bookmarks = aBookmarkArray;
        
        this.setImage(aBookmarkArray.length > 0 ? aBookmarkArray[0].icon : null);
        this.setAttribute('empty', this.bookmarks.length == 0);
        
        this.eventSupport.fire( {}, this.BOOKMARKS_CHANGED);
    };
    
    
    this.removeLauncher = function() {
        let container = document.getElementById('com_sppad_booky_launchers');
        container.removeChild(this.node);
        
        let overflowContainer = document.getElementById('com_sppad_booky_launchers_overflow_menu');
        overflowContainer.removeChild(this.menuNode);
       
        for(let i=0; i<this.tabs.length; i++)
            this.tabs[i].setAttribute('com_sppad_booky_hasLauncher', false);
       
        com.sppad.booky.Launcher.launcherMap.remove(this.id);
        
        this.forceCloseOverflowMenu();
    };
    
    /**
     * Updates this launcher to reflect changes made in a tab.
     * 
     * @param aTab
     *            A tab that has changed
     */
    this.updateTab = function(aTab) {
        this.updateAttributes();
    };
    
    /**
     * Updates this launcher to reflect the selected state of a tab.
     * 
     * @param aTab
     *            A tab that has changed
     */
    this.updatedSelectedState = function(aTab) {
        this.updateAttributes();
        this.evaluateTabIndexIndicator();
    };
    
    /**
     * Moves the DOM node for the launcher.
     * 
     * @param aLauncherId
     *            The id of the launcher to move before. If null, the launcher
     *            is moved to the end.
     */
    this.createBefore = function(aLauncherId) {
        
        let launcherNext = com.sppad.booky.Launcher.getLauncher(aLauncherId);
        
        let container = document.getElementById('com_sppad_booky_launchers');
        let overflowContainer = document.getElementById('com_sppad_booky_launchers_overflow_menu');
        
        let nodeAnchor = launcherNext ? launcherNext.node : null;
        let menuNodeAnchor = launcherNext ? launcherNext.menuNode : null;
        
        this.node = container.insertBefore(this.node, nodeAnchor);
        this.menuNode = overflowContainer.insertBefore(this.menuNode, menuNodeAnchor);
        
        for(let i=this.tabs.length - 1; i>=0; i--)
            this.placeTab(this.tabs[i], true);
    };
    
    this.addListener = function(listener, type) { self.eventSupport.addListener(listener, type); };
    this.removeListener = function(listener, type) { self.eventSupport.removeListener(listener, type); };
    
    this.createBefore(null);
    this.setBookmarks([]);
    this.updateAttributes();
    
    this.node.addEventListener("DOMMouseScroll", this.scroll.bind(this), false);
    this.node.js = self;
    this.menuNode.js = self;
    
    com.sppad.booky.Launcher.launcherMap.put(this.id, this);
}

com.sppad.booky.Launcher.prototype.TABS_ADDED = "LAUNCHER_TAB_ADDED";
com.sppad.booky.Launcher.prototype.TABS_MOVED = "LAUNCHER_TAB_MOVED";
com.sppad.booky.Launcher.prototype.TABS_REMOVED = "LAUNCHER_TAB_REMOVED";
com.sppad.booky.Launcher.prototype.BOOKMARKS_CHANGED = "LAUNCHER_BOOKMARKS_CHANGED";

/**
 * Shows a tooltip when hovering over a launcher. The tooltip is centered
 * horizontally, below the launcher.
 */
com.sppad.booky.Launcher.prototype.mouseenter = function() {
    let tooltip = document.getElementById('com_sppad_booky_tooltip');
    let tooltipBox = document.getElementById('com_sppad_booky_tooltip_box');

    // Remove all the labels from the previous tooltip
    while(tooltipBox.firstChild)
        tooltipBox.removeChild(tooltipBox.firstChild);
    
    // If the title is blank/null/undefined, use the domains in the launcher
    let labelTexts = this.title ? [ this.title ] : this.getDomains();
    if(labelTexts.length == 0)
        labelTexts = [ '( empty group )' ];
    
    // For each label text item, create and add a label
    for(let i=0; i<labelTexts.length; i++) {
        let label = document.createElement('label');
        label.setAttribute('value', labelTexts[i]);
        
        tooltipBox.appendChild(label);
    }
    
    // need to open tooltip once first to find out the dimensions for centering
    tooltip.openPopup(this.node, 'after_start', 0, 0, false, false);
    
    let xOffset = (-tooltip.boxObject.width/2) + (this.node.boxObject.width / 2);
    let yOffset = -20;          
    
    tooltip.hidePopup();    // need to hide it so that it is repositioned
    tooltip.openPopup(this.node, 'after_start', xOffset, yOffset, false, false);
};

com.sppad.booky.Launcher.prototype.mouseleave = function() {
    let tooltip = document.getElementById('com_sppad_booky_tooltip');
    tooltip.hidePopup();
};      

com.sppad.booky.Launcher.prototype.dragstart = function(event) {
    let dt = event.dataTransfer;
    dt.setData('text/com-sppad-booky-launcherId', this.id); 
    dt.setData('text/uri-list', this.bookmarks.join("\n"));
    dt.addElement(event.target);

    // Without this check, drag/drop fails for menu launcher
    if(event.target === this.node) {                    
        let tooltip = document.getElementById('com_sppad_booky_tooltip');
        tooltip.setAttribute('hidden', true);    
    }
};

com.sppad.booky.Launcher.prototype.dragend = function(event) {
    let tooltip = document.getElementById('com_sppad_booky_tooltip');
    tooltip.setAttribute('hidden', false);
};

/**
 * Handles a click event on a launcher or overflow launcher.
 */
com.sppad.booky.Launcher.prototype.command = function(event) {
    gBrowser.selectedTab = event.target.tab;
};

/**
 * Handles a click event on a launcher.
 */
com.sppad.booky.Launcher.prototype.click = function(event) {
    
    if(event.altKey)
        this.manage();
    else if(event.button == 0)
        this.switchTo(true, true, event.shiftKey);
    else if(event.button == 1)
        this.openTab();

};

/**
 * Handles a mouse scroll event on a launcher.
 */
com.sppad.booky.Launcher.prototype.scroll = function(event) {
    this.switchTo(false, event.detail > 0, event.shiftKey);  
};

/**
 * Fills out the history menu in either the launcher context or overflow menus.
 * Cleans out all existing items and performs a new query to add all relevant
 * items.
 */
com.sppad.booky.Launcher.prototype.historyPopupShowing = function(event) {
    let node = event.target;
    
    while(node.firstChild)
        node.removeChild(node.firstChild);
    
    let numberOfDays = com.sppad.booky.CurrentPrefs['historyMenuDays'];
    let maxResults = com.sppad.booky.CurrentPrefs['historyMenuItems'];
   
    let domains = this.getDomains();
    if(domains.length == 0)
        return;
    
    let results = com.sppad.booky.History.queryHistoryArray(domains, numberOfDays, maxResults);
    
    for(let i=0; i<results.length; i++) {
        let result = results[i];
        
        let menuitem = document.createElement('menuitem');
        menuitem.setAttribute('label', result.title);
        menuitem.setAttribute('image', result.icon);
        menuitem.setAttribute('tooltiptext', result.uri);
        menuitem.addEventListener('command', function(event) { this.openTab(result.uri); }.bind(this) );
        
        node.appendChild(menuitem);
    }

    if(results.length == 0) {
        let menuitem = document.getElementById('com_sppad_booky_noHistoryMenuItem').cloneNode(false);
        node.appendChild(menuitem);
    }
    
}

/**
 * Fills out the bookmarks menu in either the launcher context or overflow
 * menus. Checks if any new bookmarks have been added since the last time the
 * menu has been opened. If so, it cleans out all existing items and adds all
 * the bookmarks to the menu.
 */
com.sppad.booky.Launcher.prototype.bookmarksPopupShowing = function(event) {
    let node = event.target;
    if(node.bookmarksUpdateTime != this.bookmarksUpdateTime) {
        // Do not remove nodes that are not bookmarks
        let toRemove = new Array();
        let children = node.childNodes;
        for(let i=0; i<children.length; i++)
            if(children[i].hasAttribute('bookmark'))
                toRemove.push(children[i]);
        
        for(let i=0; i<toRemove.length; i++)
            node.removeChild(toRemove[i]);
    
        for(let i=0; i<this.bookmarks.length; i++) {
            let bookmark = this.bookmarks[i];
            
            let menuitem = document.createElement('menuitem');
            menuitem.setAttribute('bookmark', true);
            menuitem.setAttribute('label', bookmark.title || bookmark.uri);
            menuitem.setAttribute('image', bookmark.icon);
            menuitem.setAttribute('tooltiptext', bookmark.uri);
            menuitem.addEventListener('command', function(event) { this.openTab(bookmark.uri); }.bind(this) );
            
            node.appendChild(menuitem);
        }
        
        node.bookmarksUpdateTime = this.bookmarksUpdateTime;
    }
};

/**
 * Fills out the tabs menu in either the launcher context or overflow menus.
 * Checks if any new tabs have been added since the last time the menu has been
 * opened. If so, it cleans out all existing items and adds all the tabs to the
 * menu.
 * 
 * Whether or not there have been any new tabs added, the properties for the
 * menu item are updated based on the tab attributes.
 */
com.sppad.booky.Launcher.prototype.tabsPopupShowing = function(event) {
    let node = event.target;
    if(node.tabsUpdateTime != this.tabsUpdateTime)
    {
        while(node.firstChild)
            node.removeChild(node.firstChild);

        for(let i=0; i<this.tabs.length; i++) {
            let tab = this.tabs[i];
              
            let menuitem = document.createElement('menuitem');
            menuitem.tab = tab;
            menuitem.setAttribute('class', 'com_sppad_booky_tab');
            menuitem.addEventListener('command', function(event) { gBrowser.selectedTab = tab; }.bind(this) );
              
            node.appendChild(menuitem);
        }
          
        node.tabsUpdateTime = this.tabsUpdateTime;
    }

    let attributes = [ 'label', 'image', 'unread', 'selected', 'titlechanged'];
    let tabMenuItems = node.childNodes;
    for(let i=0; i<tabMenuItems.length; i++) {
        attributes.forEach(function(attr) {
            tabMenuItems[i].setAttribute(attr, tabMenuItems[i].tab.getAttribute(attr));
        });
    }
};

com.sppad.booky.Launcher.prototype.contextShowing = function(event) {
    document.getElementById('com_sppad_booky_tooltip').setAttribute('hidden', true);
    
    this.disableMenuItems(this.node);
};

com.sppad.booky.Launcher.prototype.contextHiding = function(event) {
    document.getElementById('com_sppad_booky_tooltip').setAttribute('hidden', false);
};

com.sppad.booky.Launcher.prototype.overflowMenuShowing = function(event) {
    this.disableMenuItems(this.menuNode);
};

/**
 * Closes all the tabs in the launcher.
 */
com.sppad.booky.Launcher.prototype.close = function(event) {
    while(this.tabs.length > 0)
        gBrowser.removeTab(this.tabs.pop());
};

/**
 * Reloads all the tabs in the launcher.
 */
com.sppad.booky.Launcher.prototype.reload = function(event) {
    for(let i=0; i<this.tabs.length; i++)
        gBrowser.reloadTab(this.tabs[i]);
};

/**
 * Removes the launcher, removing all the associated bookmarks.
 */
com.sppad.booky.Launcher.prototype.remove = function(event) {
    com.sppad.booky.Bookmarks.removeBookmark(this.id);
    this.contextHiding();
};

/**
 * Opens the management page for the launcher.
 */
com.sppad.booky.Launcher.prototype.manage = function(event) {
    com.sppad.booky.Details.showDetailsPage(this);
};


/**
 * Opens all the bookmarks in the launcher.
 */
com.sppad.booky.Launcher.prototype.openAllBookmarks = function(event) {
    let count = this.bookmarks.length;
    for(let i=0; i<count; i++)
        this.openTab(this.bookmarks[i].uri);
}

/** Maps ids to Launchers */
com.sppad.booky.Launcher.launcherMap = new com.sppad.collections.Map();
com.sppad.booky.Launcher.getLauncher = function(aID) {
    return this.launcherMap.get(aID);
};

com.sppad.booky.Launcher.createLauncher = function(aID) {
    return new com.sppad.booky.Launcher(aID);
};

com.sppad.booky.Launcher.hasLauncher = function(aID) {
    return this.launcherMap.get(aID) != null;
};

com.sppad.booky.Launcher.showIndexIndicatorEvent;
com.sppad.booky.Launcher.showIndexIndicator = function(value) {
    let indicator = document.getElementById('com_sppad_scrollProgress_label');
    indicator.setAttribute('value', value);
    
    let indicatorWrapper = document.getElementById('com_sppad_scrollProgress');
    indicatorWrapper.removeAttribute('com_sppad_booky_hide');
    indicatorWrapper.setAttribute('source', 'com_sppad_booky');
    
    /**
     * Use the bottom of navigator-toolbox rather than the y position of browser
     * to handle Fullscreen Toolbar Hover addon.
     */
    let navbar = document.getElementById('navigator-toolbox');
    let yOffset = navbar.boxObject.y + navbar.boxObject.height;
    indicatorWrapper.style.top = yOffset + "px";
    
    /*
     * Want to make sure that the css rule for attribute removal (setting
     * opacity to visible state) triggers. If calls are back to back, it does
     * not work correctly. It appears to be okay when placed apart (a timing
     * thing?), but want to make sure it works correctly
     */
    clearTimeout(this.showIndexIndicatorEvent);
    this.showIndexIndicatorEvent = setTimeout(function() {
        indicatorWrapper.setAttribute('com_sppad_booky_hide', 'fadeout');    
    }, 1);
};

com.sppad.booky.Launcher.hideIndexIndicator = function() {
    let indicatorWrapper = document.getElementById('com_sppad_scrollProgress');
    
    clearTimeout(this.showIndexIndicatorEvent);
    indicatorWrapper.setAttribute('com_sppad_booky_hide', 'now');
};