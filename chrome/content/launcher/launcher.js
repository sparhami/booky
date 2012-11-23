var com = com || {};
com.sppad = com.sppad || {};

com.sppad.Launcher = function(aID) {

    var self = this;
    var ordinal = 0;
    var overflow = false;
    var id = aID;
    var uri = "";
    var tabs = [];
    var bookmarks = [];
    var bookmarkIds= [];
    var node = document.createElement('launcher');
    var overflowNode = document.createElement('menuitem');
    
    this.openTab = function() {
        if(tabs.length == 0)
            gBrowser.selectedTab = gBrowser.addTab(uri);
        else
            gBrowser.selectedTab = tabs[0];
    };
    
    var updateCounts = function() {
      
        node.setAttribute("hasSingle", tabs.length > 0);
        node.setAttribute("hasMultiple", tabs.length > 1);
        
        let busy = false;
        let titleChanged = false;
        for(let i=0; i<tabs.length; i++) {
            busy |= (tabs[i].com_sppad_booky_busy == true);
            titleChanged |= (tabs[i].com_sppad_booky_titleChanged == true);
        }

        node.setAttribute("busy", busy == true);
        node.setAttribute("titleChanged", titleChanged == true);
    };

    this.getId = function() {
        return id;
    };
    
    this.getNode = function() {
        return node;
    };
    
    this.getOverflowNode = function() {
        return overflowNode;
    };
    
    this.getBookmarks = function() {
        return bookmarks;
    };
    
    this.getBookmarkIds = function() {
        return bookmarkIds;
    };
    
    this.isOverflow = function() {
        return overflow;
    };
    
    this.getOrdinal = function() {
        return ordinal;
    };
    
    this.setImage = function(anImage) {
        let image = anImage || 'chrome://mozapps/skin/places/defaultFavicon.png';
        node.setAttribute('image', image);
        overflowNode.setAttribute('image', image);
    };
    
    this.setOverflow = function(setOverflow) {
        overflow = setOverflow;
        
        node.setAttribute('vHidden', overflow);
        overflowNode.setAttribute('vCollapse', !overflow);    
    };
    
    this.setOrdinal = function(setOrdinal) {
        ordinal = setOrdinal;
        
        node.ordinal = setOrdinal;
        overflowNode.ordinal = setOrdinal;
    };
    
    this.addTab = function(aTab) {
        tabs.push(aTab);
        aTab.com_sppad_booky_id = id;
        aTab.com_sppad_booky_launcher = this;
        aTab.setAttribute('com_sppad_booky_hasLauncher', true);
        
        com.sppad.Utils.dump("Added tab to group " + id + "\n");
        updateCounts();
        
        this.setSelected(gBrowser.selectedTab == aTab);
    };
    
    this.addBookmark = function(aUri, anImage, aBookmarkId ) {
        bookmarkIds.push(aBookmarkId);
        bookmarks.push(aUri);
        
        uri = aUri;
        this.setImage(anImage);
    };
    
    this.removeBookmark = function(aUri, aBookmarkId) {
       com.sppad.Utils.dump("removing " + aUri + " from launcher " + id + "\n");
        
       com.sppad.Utils.removeFromArray(bookmarkIds, aBookmarkId);
       com.sppad.Utils.removeFromArray(bookmarks, aUri);
       
       if(bookmarkIds.length == 0) {
           let container = document.getElementById('com_sppad_booky_launchers');
           container.removeChild(node);
           
           for(let i=0; i<tabs.length; i++)
               tabs[i].setAttribute('com_sppad_booky_hasLauncher', false);
           
           com.sppad.Utils.removeFromArray(com.sppad.Launcher.launchers, this);
           com.sppad.Utils.removeFromArray(com.sppad.Launcher.launcherIDs, id);
       }
    };
    
    this.removeTab = function(aTab) {
        com.sppad.Utils.removeFromArray(tabs, aTab);
        delete aTab.com_sppad_booky_launcher;
        aTab.removeAttribute('com_sppad_booky_hasLauncher');
        
        com.sppad.Utils.dump("Removed tab from group " + id + "\n");
        updateCounts();
        
        this.setSelected(false);
    };
    
    this.setSelected = function(active) {
        node.setAttribute('selected', active);
    };
    
    this.updateTab = function(aTab) {
        updateCounts();
    };
    
    this.hasTab = function(aTab) {
        return aTab.com_sppad_booky_launcher == this;
    };
    
    this.createBefore = function(aLauncher) {
        let container = document.getElementById('com_sppad_booky_launchers');
        let overflowContainer = document.getElementById('com_sppad_booky_launchers_overflow_menu');
        
        let nodeAnchor = aLauncher ? aLauncher.getNode() : null;
        let overflowNodeAnchor = aLauncher ? aLauncher.getOverflowNode() : null;
        
        container.insertBefore(node, nodeAnchor);
        overflowContainer.insertBefore(overflowNode, overflowNodeAnchor);
        
        overflowNode.setAttribute('label', id);
        node.setJavaScriptObject(self);
    };
    

    this.createBefore(null);
    
    updateCounts();
    
    return {
        setImage: this.setImage,
        setOverflow: this.setOverflow,
        setOrdinal: this.setOrdinal,
        getId: this.getId,
        getNode: this.getNode,
        getOverflowNode: this.getOverflowNode,
        getBookmarks: this.getBookmarks,
        getBookmarkIds: this.getBookmarkIds,
        getOrdinal: this.getOrdinal,
        isOverflow: this.isOverflow,
        addTab: this.addTab,
        openTab: this.openTab,
        addBookmark: this.addBookmark,
        hasTab: this.hasTab,
        removeTab: this.removeTab,
        removeBookmark: this.removeBookmark,
        setSelected: this.setSelected,
        updateTab: this.updateTab,
        createBefore: this.createBefore,
    };
}

com.sppad.Launcher.prototype.mouseenter = function() {
    com.sppad.Launcher.hoveringLauncher = this;
    if(com.sppad.Launcher.dragging)
        return;
    
    let node = this.getNode();
    let tooltip = document.getElementById('com_sppad_booky_tooltip');
    let tooltipLabel = document.getElementById('com_sppad_booky_tooltip_label');

    // need to open tooltip once first to find out the dimensions for centering
    tooltipLabel.setAttribute('value', this.getId());
    tooltip.openPopup(node, 'after_start', 0, 0, false, false);
    
    let xOffset = (-tooltip.boxObject.width/2) + (node.boxObject.width / 2);
    let yOffset = -20;
    
    tooltip.hidePopup();    // need to hide it so that it is repositioned
    tooltip.openPopup(node, 'after_start', xOffset, yOffset, false, false);
};

com.sppad.Launcher.prototype.mouseleave = function() {
    com.sppad.Launcher.hoveringLauncher = null;
    
    let tooltip = document.getElementById('com_sppad_booky_tooltip');
    tooltip.hidePopup();
};

com.sppad.Launcher.prototype.dragstart = function(event) {
    com.sppad.Launcher.dragging = true;
    
    let dt = event.dataTransfer;
    dt.setData('text/uri-list', this.getId());
    dt.addElement(this.getNode());
    
    let tooltip = document.getElementById('com_sppad_booky_tooltip');
    tooltip.hidePopup();
};

com.sppad.Launcher.prototype.dragend = function(event) {
    com.sppad.Launcher.dragging = false;
    if(com.sppad.Launcher.hoveringLauncher)
        com.sppad.Launcher.hoveringLauncher.mouseenter();
};

com.sppad.Launcher.prototype.command = function() {
    this.openTab();
};


/** Workaround for dragging too fast and seeing a tooltip while dragging */
com.sppad.Launcher.dragging = false;
com.sppad.Launcher.hoveringLauncher = null;
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