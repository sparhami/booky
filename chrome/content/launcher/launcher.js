var com = com || {};
com.sppad = com.sppad || {};

com.sppad.Launcher = function(aID) {
    
    let overflowTemplateNode = document.getElementById('com_sppad_booky_launcher_overflow_item_template');
    
    var self = this;
    var _selectedIndex = 0;
    this.tabsUpdateTime = 0;
    this.bookmarksUpdateTime = 0;
    this.id = aID;
    this.tabs = [];
    this.selected = false;
    this.bookmarks = [];
    this.bookmarkIDs= [];
    this.node = document.createElement('launcher');
    this.menuNode = overflowTemplateNode.cloneNode(true);
    this.menuNode.removeAttribute('id');
    
    this.openTab = function(aUri) {     
        gBrowser.selectedTab = gBrowser.addTab(aUri || this.bookmarks[0]);
    };       
    
    this.switchTo = function(openIfClosed, next, reverse) {
        
        dump("switchTo " + openIfClosed + " " + next + " " + reverse + "\n");
        if(openIfClosed && this.tabs.length == 0)
            this.openTab();
        else {
            let direction = this.selected ? (next == true ? 1 : -1) : 0;
            dump("_selectedIndex " + _selectedIndex + " direction " + direction + "\n");
            dump("this.tabs.length " + this.tabs.length + " \n");
            
            let index = this.getNextIndex(direction, reverse);
            
            gBrowser.selectedTab = this.tabs[index];
        }
    };
    
    this.mod = function(n, m) {
        return ( ( n % m ) + m ) % m;
    };
    
    this.getNextIndex = function(direction, reverse) {
        let index = _selectedIndex;
        let count = direction > 0 ? +1 :
                    direction < 0 ? -1 :
                    0;
        
        index += (reverse === true) ? 0 - count : count;
        return this.mod(index, this.tabs.length);
    };
    
    /**
     * Updates the attributes applied to the DOM nodes for this launcher.
     */
    this.updateAttributes = function() {
        let busy = false;
        let selected = false;
        let titleChanged = false;
        for(let i=0; i<this.tabs.length; i++) {
            let tab = this.tabs[i];
            
            busy |= tab.com_sppad_booky_busy == true;
            selected |= tab == gBrowser.selectedTab;
            titleChanged |= tab.com_sppad_booky_titleChanged == true;
            
            if(tab == gBrowser.selectedTab)
                _selectedIndex = i;
        }
        
        for(let i=0; i<this.tabs.length; i++)
            this.tabs[i].setAttribute("com_sppad_booky_activeGroup", selected == true);

        this.selected = selected;
        
        this.setAttribute("busy", busy == true);
        this.setAttribute("selected", selected == true);
        this.setAttribute("titleChanged", titleChanged == true);
        this.setAttribute('label', this.id);
        
        this.setAttribute("hasSingle", this.tabs.length > 0);
        this.setAttribute("hasMultiple", this.tabs.length > 1);
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
     */
    this.setImage = function(anImage) {
        this.setAttribute('image', anImage || 'chrome://mozapps/skin/places/defaultFavicon.png');
    };
    
    /**
     * Sets the overflow status, indicating that this launcher doesn't fit in
     * the quick launch area,
     */
    this.setOverflow = function(overflow) {
        this.setAttribute('overflow', overflow);
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
            com.sppad.Utils.dump('WW - This tab is already in this launcher.\n');
            return;
        }
        
        this.tabsUpdateTime = Date.now();
        
        this.tabs.push(aTab);
        aTab.com_sppad_booky_launcher = this;
        aTab.com_sppad_booky_launcherId = this.id;
        aTab.setAttribute('com_sppad_booky_hasLauncher', true);
        
        this.updateAttributes();
        this.placeTab(aTab, false);
    };
    
    /**
     * Removes a tab from the launcher.
     * 
     * @param aTab
     *            The tab to remove
     */
    this.removeTab = function(aTab) {
        if(aTab.com_sppad_booky_launcher !== this) {
            com.sppad.Utils.dump('WW - This tab is not in this launcher.\n');
            return;
        }
        
        this.tabsUpdateTime = Date.now();
        
        com.sppad.Utils.removeFromArray(this.tabs, aTab);
        delete aTab.com_sppad_booky_launcher;
        aTab.removeAttribute('com_sppad_booky_hasLauncher');
        
        this.updateAttributes();
        _selectedIndex = Math.max(_selectedIndex, this.tabs.length - 1);
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
        
        this.bookmarkIDs.push(aBookmarkId);
        this.bookmarks.push(aUri);
        com.sppad.Launcher.bookmarkIDToLauncher[aBookmarkId] = this;
        
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
        
        let index = com.sppad.Utils.getIndexInArray(this.bookmarkIDs, aBookmarkId);
        this.bookmarkIDs.splice(index, 1);
        this.bookmarks.splice(index, 1);
        
        delete com.sppad.Launcher.bookmarkIDToLauncher[aBookmarkId];
        
        if(this.bookmarkIDs.length == 0) {
            let container = document.getElementById('com_sppad_booky_launchers');
            container.removeChild(this.node);
           
            for(let i=0; i<this.tabs.length; i++)
                this.tabs[i].setAttribute('com_sppad_booky_hasLauncher', false);
           
            com.sppad.Utils.removeFromArray(com.sppad.Launcher.launchers, this);
            com.sppad.Utils.removeFromArray(com.sppad.Launcher.launcherIDs, this.id);
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
    
    com.sppad.Launcher.launchers.push(this);
    com.sppad.Launcher.launcherIDs.push(this.id);
}

com.sppad.Launcher.prototype.mouseenter = function() {
    let tooltip = document.getElementById('com_sppad_booky_tooltip');
    let tooltipLabel = document.getElementById('com_sppad_booky_tooltip_label');

    // need to open tooltip once first to find out the dimensions for centering
    tooltipLabel.setAttribute('value', this.id);
    tooltip.openPopup(this.node, 'after_start', 0, 0, false, false);
    
    let xOffset = (-tooltip.boxObject.width/2) + (this.node.boxObject.width / 2);
    let yOffset = -20;          
    
    tooltip.hidePopup();    // need to hide it so that it is repositioned
    tooltip.openPopup(this.node, 'after_start', xOffset, yOffset, false, false);
};

com.sppad.Launcher.prototype.mouseleave = function() {
    let tooltip = document.getElementById('com_sppad_booky_tooltip');
    tooltip.hidePopup();
};      

com.sppad.Launcher.prototype.dragstart = function(event) {
    let dt = event.dataTransfer;
    dt.setData('text/uri-list', this.bookmarks[0]);
    dt.addElement(event.target);

    // Without this check, drag/drop fails for menu launcher
    if(event.target === this.node) {                    
        let tooltip = document.getElementById('com_sppad_booky_tooltip');
        tooltip.setAttribute('hidden', true);    
    }
};

com.sppad.Launcher.prototype.dragend = function(event) {
    let tooltip = document.getElementById('com_sppad_booky_tooltip');
    tooltip.setAttribute('hidden', false);
};

com.sppad.Launcher.prototype.command = function(event) {
    gBrowser.selectedTab = event.target.tab;
};

com.sppad.Launcher.prototype.click = function(event) {
    
    if(event.button == 0)
        this.switchTo(true, true, event.shiftKey);
    else if(event.button == 1)
        this.openTab();
    else if(event.button == 2)
        this.node.contextMenu.openPopup(this.node, "after_start", 0, 0, false, false);
    
};

com.sppad.Launcher.prototype.scroll = function(event) {
    dump("scroll " + event.detail + " shift? " + event.shiftKey + "\n");
    this.switchTo(false, event.detail < 0, event.shiftKey);  
};

com.sppad.Launcher.prototype.bookmarksPopupShowing = function(event) {
    let node = event.target;
    if(node.bookmarksUpdateTime == this.bookmarksUpdateTime)
        return;
    
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
        menuitem.setAttribute('label', bookmark);
        menuitem.addEventListener('command', function(event) { this.openTab(bookmark); }.bind(this) );
        
        node.appendChild(menuitem);
    }
    
    node.bookmarksUpdateTime = this.bookmarksUpdateTime;
};

com.sppad.Launcher.prototype.tabsPopupShowing = function(event) {
    let node = event.target;
    if(node.tabsUpdateTime == this.tabsUpdateTime)
    {
        let tabMenuItems = node.childNodes;
        for(let i=0; i<tabMenuItems.length; i++)
            tabMenuItems[i].setAttribute('label', tabMenuItems[i].tab.label);
    }
    else
    {
        while(node.firstChild)
            node.removeChild(node.firstChild);

        for(let i=0; i<this.tabs.length; i++) {
            let tab = this.tabs[i];
              
            let menuitem = document.createElement('menuitem');
            menuitem.tab = tab;
            menuitem.setAttribute('label', tab.label);
            menuitem.addEventListener('command', function(event) { gBrowser.selectedTab = event.target.tab; }.bind(this) );
              
            node.appendChild(menuitem);
        }
          
        node.tabsUpdateTime = this.tabsUpdateTime;
    }

};

com.sppad.Launcher.prototype.contextShowing = function(event) {
    let tooltip = document.getElementById('com_sppad_booky_tooltip');
    tooltip.setAttribute('hidden', true);
    
    this.disableMenuItems(this.node);
};

com.sppad.Launcher.prototype.contextHiding = function(event) {
    let tooltip = document.getElementById('com_sppad_booky_tooltip');
    tooltip.setAttribute('hidden', false);
};

com.sppad.Launcher.prototype.overflowMenuShowing = function(event) {
    this.disableMenuItems(this.menuNode);
};

com.sppad.Launcher.prototype.close = function(event) {
    while(this.tabs.length > 0)
        gBrowser.removeTab(this.tabs.pop());
};

com.sppad.Launcher.prototype.reload = function(event) {
    for(let i=0; i<this.tabs.length; i++)
        gBrowser.reloadTab(this.tabs[i]);
};

com.sppad.Launcher.prototype.remove = function(event) {
    /*
     * Bookmark event firing actually removes the bookmark. Don't use a while
     * loop since if things go bad, could get stuck. Note that we only ever
     * remove the 0th index. Also don't want to check length everythime since it
     * will be modified.
     */
    let count = this.bookmarkIDs.length;
    for(let i=0; i<count; i++)
        com.sppad.Bookmarks.removeBookmark(this.bookmarkIDs[0]);
};

com.sppad.Launcher.prototype.openAllBookmarks = function(event) {
    let count = this.bookmarkIDs.length;
    for(let i=0; i<count; i++)
        this.openTab(this.bookmarks[i]);
}


/** Maps bookmark ids to Launchers */
com.sppad.Launcher.bookmarkIDToLauncher = {};
/** Maps ids to Launchers */
com.sppad.Launcher.launchers = new Array();
com.sppad.Launcher.launcherIDs = new Array();
com.sppad.Launcher.getLauncher = function(aID) {
    let index = com.sppad.Utils.getIndexInArray(this.launcherIDs, aID);
    return (index >=  0) ? this.launchers[index] : new com.sppad.Launcher(aID);
};

com.sppad.Launcher.hasLauncher = function(aID) {
    return com.sppad.Utils.getIndexInArray(this.launcherIDs, aID) >= 0;
};

com.sppad.Launcher.getLauncherFromBookmarkId = function(aBookmarkId) {
    return this.bookmarkIDToLauncher[aBookmarkId];
}