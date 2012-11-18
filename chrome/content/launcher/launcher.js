var com = com || {};
com.sppad = com.sppad || {};

com.sppad.Launcher = function(aID) {

    var id = aID;
    var uri = "";
    var tabs = [];
    var bookmarks = [];

    dump("adding launcher with id " + id + "\n");
    
    var node = document.createElement('launcher');
    document.getElementById("com_sppad_booky_launchers").appendChild(node);
    node.setJavaScriptObject(this);
    
    var button = document.getAnonymousElementByAttribute(node, "anonid",
            "toolbarbutton");
    
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
    
    this.addBookmark = function(aUri, anImage ) {
        uri = aUri;
        this.setImage(anImage);
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

    button.addEventListener('command', openTab, false);

    updateCounts();
    dump("done adding launcher with id " + id + "\n");

    return {
        setImage: this.setImage,
        addTab: this.addTab,
        addBookmark: this.addBookmark,
        hasTab: this.hasTab,
        removeTab: this.removeTab,
        updateTab: this.updateTab, 
    };
}

com.sppad.Launcher.prototype.onMouseEnter = function() {
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

com.sppad.Launcher.prototype.onMouseLeave = function() {
    let tooltip = document.getElementById('com_sppad_booky_tooltip');
    tooltip.hidePopup();
};


/** Maps ids to Launchers */
com.sppad.Launcher.launcherMap = {};
com.sppad.Launcher.getLauncher = function(aID) {
    if (!this.launcherMap.hasOwnProperty(aID))
        this.launcherMap[aID] = new com.sppad.Launcher(aID);

    return this.launcherMap[aID];
};

com.sppad.Launcher.hasLauncher = function(aID) {
    return this.launcherMap.hasOwnProperty(aID);
};