if (typeof com == "undefined") {
  var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

com.sppad.booky.Launcher = function(aID) {
    
    let overflowTemplateNode = document.getElementById('com_sppad_booky_launcher_overflow_item_template');
    
    let self = this;
    this._selectedIndex = 0;
    this.tabsUpdateTime = 0;
    this.bookmarksUpdateTime = 0;
    this.id = aID;
    this.title = aID;
    this.tabs = [];
    this.selected = false;
    this.bookmarks = [];
    this.bookmarkIDs= [];
    this.bookmarkImages = [];
    this.node = document.createElement('launcher');
    this.menuNode = overflowTemplateNode.cloneNode(true);
    this.menuNode.removeAttribute('id');
    
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
        gBrowser.selectedTab = gBrowser.addTab(aUri || this.bookmarks[0]);
        
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
        this.setAttribute('label', this.id);
        
        this.setAttribute("hasSingle", this.tabs.length > 0);
        this.setAttribute("hasMultiple", this.tabs.length > 1);
    };
    
    /**
     * Evaluates and shows the tab index indicator if the launcher is selected.
     */
    this.evaluateTabIndexIndicator = function() {
        if(this.selected && this.tabs.length > 1)
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
        let tabsMenu = document.getAnonymousElementByAttribute(rootNode, 'class', 'launcher_menu_switchTo');
        let itemClose = document.getAnonymousElementByAttribute(rootNode, 'class', 'launcher_menu_close');
        let itemReload = document.getAnonymousElementByAttribute(rootNode, 'class', 'launcher_menu_reload');

        if(this.tabs.length == 0) {
            tabsMenu.setAttribute('disabled', 'true');
            itemClose.setAttribute('disabled', 'true');
            itemReload.setAttribute('disabled', 'true');
        } else {
            tabsMenu.removeAttribute('disabled');
            itemClose.removeAttribute('disabled');
            itemReload.removeAttribute('disabled');
        }     
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
        if(aTab.com_sppad_booky_launcher === this) {
            com.sppad.booky.Utils.dump('WW - This tab is already in this launcher.\n');
            return;
        }
        
        this.tabsUpdateTime = Date.now();
        
        this.tabs.push(aTab);
        aTab.com_sppad_booky_launcher = this;
        aTab.com_sppad_booky_launcherId = this.id;
        aTab.setAttribute('com_sppad_booky_hasLauncher', true);
        
        this.updateAttributes();
        this.placeTab(aTab, false);
        
        this.evaluateTabIndexIndicator();
    };
    
    /**
     * Removes a tab from the launcher.
     * 
     * @param aTab
     *            The tab to remove
     */
    this.removeTab = function(aTab) {
        if(aTab.com_sppad_booky_launcher !== this) {
            com.sppad.booky.Utils.dump('WW - This tab is not in this launcher.\n');
            return;
        }
        
        this.tabsUpdateTime = Date.now();
        
        com.sppad.booky.Utils.removeFromArray(this.tabs, aTab);
        delete aTab.com_sppad_booky_launcher;
        aTab.removeAttribute('com_sppad_booky_hasLauncher');
        
        this.updateAttributes();
        self._selectedIndex = Math.max(self._selectedIndex, this.tabs.length - 1);
        
        this.evaluateTabIndexIndicator();
    };
    
    /**
     * Adds a bookmark to the launcher.
     * 
     * @param aUri
     *            A String representing the URI for the bookmark
     * @param anImage
     *            The URI for the image used by the launcher
     * @param aBookmarkId
     *            The bookmark id from the bookmarks service
     */
    this.addBookmark = function(aUri, anImage, aBookmarkId) {
        this.bookmarksUpdateTime = Date.now();
        
        this.bookmarkImages.push(anImage);
        this.bookmarkIDs.push(aBookmarkId);
        this.bookmarks.push(aUri);
        com.sppad.booky.Launcher.bookmarkIDToLauncher[aBookmarkId] = this;
        
        this.setImage(anImage);
    };
    
    /**
     * Removes a bookmark from the launcher.
     * 
     * @param aBookmarkId
     *            The bookmark id from the bookmarks service
     */
    this.removeBookmark = function(aBookmarkId) {
        this.bookmarksUpdateTime = Date.now();

        let index = com.sppad.booky.Utils.getIndexInArray(this.bookmarkIDs, aBookmarkId);
        this.bookmarkImages.splice(index, 1);
        this.bookmarkIDs.splice(index, 1);
        this.bookmarks.splice(index, 1);
        
        delete com.sppad.booky.Launcher.bookmarkIDToLauncher[aBookmarkId];
        
        if(this.bookmarkIDs.length == 0) {
            let container = document.getElementById('com_sppad_booky_launchers');
            container.removeChild(this.node);
            
            let overflowContainer = document.getElementById('com_sppad_booky_launchers_overflow_menu');
            overflowContainer.removeChild(this.menuNode);
           
            for(let i=0; i<this.tabs.length; i++)
                this.tabs[i].setAttribute('com_sppad_booky_hasLauncher', false);
           
            com.sppad.booky.Launcher.launcherMap.remove(this.id);
            
            this.forceCloseOverflowMenu();
        }
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
     * Updates this launcher to reflect changes made in a tab.
     * 
     * @param aTab
     *            A tab that has changed
     */
    this.selectTab = function(aTab) {
        this.updateAttributes();
        this.evaluateTabIndexIndicator()
    };
    
    /**
     * Moves the DOM node for the launcher.
     * 
     * @param aLauncher
     *            The launcher to move before. If null, the launcher is moved to
     *            the end.
     */
    this.createBefore = function(aLauncher) {
        let container = document.getElementById('com_sppad_booky_launchers');
        let overflowContainer = document.getElementById('com_sppad_booky_launchers_overflow_menu');
        
        let nodeAnchor = aLauncher ? aLauncher.node : null;
        let menuNodeAnchor = aLauncher ? aLauncher.menuNode : null;
        
        this.node = container.insertBefore(this.node, nodeAnchor);
        this.menuNode = overflowContainer.insertBefore(this.menuNode, menuNodeAnchor);
        
        for(let i=this.tabs.length - 1; i>=0; i--)
            this.placeTab(this.tabs[i], true);
    };
    
    this.createBefore(null);
    this.updateAttributes();
    
    this.node.addEventListener("DOMMouseScroll", this.scroll.bind(this), false);
    this.node.js = self;
    this.menuNode.js = self;
    
    com.sppad.booky.Launcher.launcherMap.put(this.id, this);
}

/**
 * Shows a tooltip when hovering over a launcher. The tooltip is centered
 * horizontally, below the launcher.
 */
com.sppad.booky.Launcher.prototype.mouseenter = function() {
    let tooltip = document.getElementById('com_sppad_booky_tooltip');
    let tooltipLabel = document.getElementById('com_sppad_booky_tooltip_label');

    // need to open tooltip once first to find out the dimensions for centering
    tooltipLabel.setAttribute('value', this.title);
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
    dt.setData('text/uri-list', this.bookmarks[0]);
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
    
    if(event.button == 0)
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
    let results = com.sppad.booky.History.queryHistory(this.id, numberOfDays, maxResults);
    
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
            let image = this.bookmarkImages[i];
            
            let menuitem = document.createElement('menuitem');
            menuitem.setAttribute('bookmark', true);
            menuitem.setAttribute('label', bookmark);
            menuitem.setAttribute('image', image);
            menuitem.addEventListener('command', function(event) { this.openTab(bookmark); }.bind(this) );
            
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
            menuitem.addEventListener('command', function(event) { gBrowser.selectedTab = event.target.tab; }.bind(this) );
              
            node.appendChild(menuitem);
        }
          
        node.tabsUpdateTime = this.tabsUpdateTime;
    }

    let tabMenuItems = node.childNodes;
    for(let i=0; i<tabMenuItems.length; i++) {
        tabMenuItems[i].setAttribute('label', tabMenuItems[i].tab.label);
        tabMenuItems[i].setAttribute('image', tabMenuItems[i].tab.getAttribute('image'));
        tabMenuItems[i].setAttribute('unread', tabMenuItems[i].tab.getAttribute('unread'));
        tabMenuItems[i].setAttribute('selected', tabMenuItems[i].tab.getAttribute('selected'));
        tabMenuItems[i].setAttribute('titlechanged', tabMenuItems[i].tab.getAttribute('titlechanged'));
    }
};

com.sppad.booky.Launcher.prototype.contextShowing = function(event) {
    let tooltip = document.getElementById('com_sppad_booky_tooltip');
    tooltip.setAttribute('hidden', true);
    
    this.disableMenuItems(this.node);
};

com.sppad.booky.Launcher.prototype.contextHiding = function(event) {
    let tooltip = document.getElementById('com_sppad_booky_tooltip');
    tooltip.setAttribute('hidden', false);
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
    /*
     * Bookmark event firing actually removes the bookmark. Don't use a while
     * loop since if things go bad, could get stuck. Note that we only ever
     * remove the 0th index. Also don't want to check length everytime since it
     * will be modified.
     */
    let count = this.bookmarkIDs.length;
    for(let i=0; i<count; i++)
        com.sppad.booky.Bookmarks.removeBookmark(this.bookmarkIDs[0]);
};

/**
 * Opens all the bookmarks in the launcher.
 */
com.sppad.booky.Launcher.prototype.openAllBookmarks = function(event) {
    let count = this.bookmarkIDs.length;
    for(let i=0; i<count; i++)
        this.openTab(this.bookmarks[i]);
}


/** Maps bookmark ids to Launchers */
com.sppad.booky.Launcher.bookmarkIDToLauncher = {};
/** Maps ids to Launchers */
com.sppad.booky.Launcher.launcherMap = new com.sppad.booky.Map();
com.sppad.booky.Launcher.getLauncher = function(aID) {
    return this.launcherMap.get(aID) || new com.sppad.booky.Launcher(aID);
};

com.sppad.booky.Launcher.hasLauncher = function(aID) {
    return this.launcherMap.get(aID) != null;
};

com.sppad.booky.Launcher.getLauncherFromBookmarkId = function(aBookmarkId) {
    return this.bookmarkIDToLauncher[aBookmarkId];
};

com.sppad.booky.Launcher.showIndexIndicatorEvent;
com.sppad.booky.Launcher.showIndexIndicator = function(value) {
    let indexIndicator = document.getElementById('com_sppad_booky_tabIndex_label');
    indexIndicator.setAttribute('value', value);
    
    let indexIndicatorWrapper = document.getElementById('com_sppad_booky_tabIndex');
    indexIndicatorWrapper.removeAttribute('hide');
    
    /**
     * Use the bottom of navigator-toolbox rather than the y position of browser
     * to handle Fullscreen Toolbar Hover addon.
     */
    let navbar = document.getElementById('navigator-toolbox');
    let yOffset = navbar.boxObject.y + navbar.boxObject.height;
    indexIndicatorWrapper.style.top = yOffset + "px";
    
    /*
     * Want to make sure that the css rule for attribute removal (setting
     * opacity to visible state) triggers. If calls are back to back, it does
     * not work correctly. It appears to be okay when placed apart (a timing
     * thing?), but want to make sure it works correctly
     */
    clearTimeout(this.showIndexIndicatorEvent);
    this.showIndexIndicatorEvent = setTimeout(function() {
        indexIndicatorWrapper.setAttribute('hide', 'fadeout');    
    }, 1);
};

com.sppad.booky.Launcher.hideIndexIndicator = function() {
    let indexIndicatorWrapper = document.getElementById('com_sppad_booky_tabIndex');
    
    clearTimeout(this.showIndexIndicatorEvent);
    indexIndicatorWrapper.setAttribute('hide', 'now');
};