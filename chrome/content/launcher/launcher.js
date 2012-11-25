var com = com || {};
com.sppad = com.sppad || {};

com.sppad.Launcher = function(aID) {
    
    let overflowTemplateNode = document.getElementById('com_sppad_booky_launcher_overflow_item_template');
    
    var self = this;
    this.id = aID;
    this.tabs = [];
    this.bookmarks = [];
    this.bookmarkIds= [];
    this.node = document.createElement('launcher');
    this.menuNode = overflowTemplateNode.cloneNode('menu');
    this.menuNode.removeAttribute('id');
    
    this.openTab = function() {     
        if(this.tabs.length == 0)
            gBrowser.selectedTab = gBrowser.addTab(this.bookmarks[0]);
        else            
            gBrowser.selectedTab = this.tabs[0];
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
        }

        this.setAttribute("busy", busy == true);
        this.setAttribute("selected", selected == true);
        this.setAttribute("titleChanged", titleChanged == true);
        this.setAttribute("hasSingle", this.tabs.length > 0);
        this.setAttribute("hasMultiple", this.tabs.length > 1);
        this.setAttribute('label', this.id);
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
    
    /**
     * Adds a tab to the launcher.
     */
    this.addTab = function(aTab) {
        this.tabs.push(aTab);
        aTab.com_sppad_booky_launcher = this;
        aTab.setAttribute('com_sppad_booky_hasLauncher', true);
        
        this.updateAttributes();
    };
    
    /**
     * Removes a tab from the launcher.
     */
    this.removeTab = function(aTab) {
        com.sppad.Utils.removeFromArray(this.tabs, aTab);
        delete aTab.com_sppad_booky_launcher;
        aTab.removeAttribute('com_sppad_booky_hasLauncher');
        
        this.updateAttributes();
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
    this.addBookmark = function(aUri, anImage, aBookmarkId ) {
        this.bookmarkIds.push(aBookmarkId);
        this.bookmarks.push(aUri);
        com.sppad.Launcher.bookmarkIDToLauncher[aBookmarkId] = this;
        
        this.setImage(anImage);
    };
    
    /**
     * Removes a bookmark from the launcher.
     * 
     * @param aUri
     *            A String representing the URI for the bookmark
     * @param aBookmarkId
     *            The bookmark id from the bookmarks service
     */
    this.removeBookmark = function(aUri, aBookmarkId) {
       com.sppad.Utils.removeFromArray(this.bookmarkIds, aBookmarkId);
       com.sppad.Utils.removeFromArray(this.bookmarks, aUri);
       delete com.sppad.Launcher.bookmarkIDToLauncher[aBookmarkId];
       
       if(this.bookmarkIds.length == 0) {
           let container = document.getElementById('com_sppad_booky_launchers');
           container.removeChild(this.node);
           
           for(let i=0; i<this.tabs.length; i++)
               this.tabs[i].setAttribute('com_sppad_booky_hasLauncher', false);
           
           com.sppad.Utils.removeFromArray(com.sppad.Launcher.launchers, this);
           com.sppad.Utils.removeFromArray(com.sppad.Launcher.launcherIDs, this.id);
       }
    };
    
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
        
        container.insertBefore(this.node, nodeAnchor);
        overflowContainer.insertBefore(this.menuNode, menuNodeAnchor);
        
        this.node.js = self;
        this.menuNode.js = self;
    };
    
    this.createBefore(null);
    this.updateAttributes();
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
    this.openTab(event);
};

/** Maps bookmark ids to Launchers */
com.sppad.Launcher.bookmarkIDToLauncher = {};
/** Maps ids to Launchers */
com.sppad.Launcher.launchers = new Array();
com.sppad.Launcher.launcherIDs = new Array();
com.sppad.Launcher.getLauncher = function(aID) {
    let index = com.sppad.Utils.getIndexInArray(this.launcherIDs, aID);
    if(index < 0) {
        this.launchers.push(new com.sppad.Launcher(aID));
        this.launcherIDs.push(aID);
        
        index = this.launchers.length - 1;
    }
   
    return this.launchers[index];
};

com.sppad.Launcher.hasLauncher = function(aID) {
    return com.sppad.Utils.getIndexInArray(this.launcherIDs, aID) >= 0;
};

com.sppad.Launcher.getLauncherFromBookmarkId = function(aBookmarkId) {
    return this.bookmarkIDToLauncher[aBookmarkId];
}