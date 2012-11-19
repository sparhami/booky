var com = com || {};
com.sppad = com.sppad || {};

com.sppad.Launcher = function(aID) {

    var id = aID;
    var uri = "";
    var tabs = [];
    var bookmarks = [];
    var bookmarkIds= [];
    
    var openTab = function() {
        if(tabs.length == 0)
            gBrowser.selectedTab = gBrowser.addTab(uri);
        else
            gBrowser.selectedTab = tabs[0];
    };
    
    var updateCounts = function() {
      
        node.setAttribute("hasSingle", tabs.length > 0);
        node.setAttribute("hasMultiple", tabs.length > 1);
        
        let busy = false;
        for(let i=0; i<tabs.length; i++)
            busy |= (tabs[i].com_sppad_booky_busy == true);
        
        node.setAttribute("busy", busy == true);
    };

    this.getId = function() {
        return id;
    };
    
    this.getNode = function() {
        return node;
    };
    
    this.getBookmarks = function() {
        return bookmarks;
    };
    
    this.getBookmarkIds = function() {
        return bookmarkIds;
    };
    
    this.setImage = function(anImage) {
        node.setAttribute('image', anImage
                || 'chrome://mozapps/skin/places/defaultFavicon.png');
    };
    
    this.addTab = function(aTab) {
        tabs.push(aTab);
        aTab.com_sppad_booky_id = id;
        aTab.com_sppad_booky_launcher = this;
        aTab.setAttribute('com_sppad_booky_hasLauncher', true);
        
        com.sppad.Utils.dump("Added tab to group " + id + "\n");
        updateCounts();
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
           com.sppad.Utils.dump('no more bookmarks, removing\n');
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
    };
    
    this.updateTab = function(aTab) {
        updateCounts();
    };
    
    this.hasTab = function(aTab) {
        return aTab.com_sppad_booky_launcher == this;
    };

    dump("adding launcher with id " + id + "\n");
    
    var node = document.createElement('launcher');
    let container = document.getElementById('com_sppad_booky_launchers');
    container.appendChild(node);

    let lastChild = container.boxObject.lastChild;
    node.ordinal = lastChild ? +lastChild.ordinal + 2 : 0;
    node.setJavaScriptObject(this);
    
    var button = document.getAnonymousElementByAttribute(node, 'anonid',
            'toolbarbutton');
    
    button.addEventListener('command', openTab, false);

    updateCounts();
    dump("done adding launcher with id " + id + "\n");
    
    
    return {
        setImage: this.setImage,
        gedId: this.getId,
        getNode: this.getNode,
        getBookmarks: this.getBookmarks,
        getBookmarkIds: this.getBookmarkIds,
        addTab: this.addTab,
        addBookmark: this.addBookmark,
        hasTab: this.hasTab,
        removeTab: this.removeTab,
        removeBookmark: this.removeBookmark,
        updateTab: this.updateTab, 
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

/** Workaround for dragging too fast and seeing a tooltip while dragging */
com.sppad.Launcher.dragging = false;
com.sppad.Launcher.hoveringLauncher = null;
/** Maps ids to Launchers */
com.sppad.Launcher.launchers = new Array();
com.sppad.Launcher.launcherIDs = new Array();
com.sppad.Launcher.getLauncher = function(aID) {
    dump("getting launcher for id " + aID + "\n");
    
    let index = com.sppad.Utils.getIndexInArray(this.launcherIDs, aID);
    if(index < 0) {
        this.launchers.push(new com.sppad.Launcher(aID));
        index = this.launcherIDs.push(aID) - 1;
    }
   
    return this.launchers[index];
};

com.sppad.Launcher.hasLauncher = function(aID) {
    return com.sppad.Utils.getIndexInArray(this.launcherIDs, aID) > 0;
};