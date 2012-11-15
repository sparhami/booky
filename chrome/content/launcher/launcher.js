var com = com || {};
com.sppad = com.sppad || {};

com.sppad.Launcher = function(aID) {

    var id = aID;
    var uri = "";
    var tabs = [];
    var bookmarks = [];

    dump("adding launcher with id " + id + "\n");
    
    var node = document.createElement('launcher');
    document.getElementById("tabdock-bookmarks").appendChild(node);

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

    button.addEventListener('command', openTab, false);

    updateCounts();
    dump("done adding launcher with id " + id + "\n");

    return {

        setImage : function(anImage) {
            node.setAttribute('image', anImage
                    || 'chrome://mozapps/skin/places/defaultFavicon.png');
        },

        addTab : function(aTab) {
            tabs.push(aTab);
            aTab.com_sppad_booky_id = id;
            aTab.com_sppad_booky_launcher = this;
            aTab.setAttribute('com_sppad_booky_hasLauncher', true);
            
            com.sppad.Utils.dump("Added tab to group " + id + "\n");
            updateCounts();
        },
        
        addBookmark: function(aUri, anImage ) {
            
            uri = aUri;
            this.setImage(anImage);
            
        },
        
        hasTab : function(aTab) {
            return aTab.com_sppad_booky_launcher == this;
        },
        
        removeTab : function(aTab) {
            com.sppad.Utils.removeFromArray(tabs, aTab);
            delete aTab.com_sppad_booky_launcher;
            aTab.removeAttribute('com_sppad_booky_hasLauncher');
            
            com.sppad.Utils.dump("Removed tab from group " + id + "\n");
            updateCounts();
        },
        
        updateTab: function(aTab) {
            com.sppad.Utils.dump("Updating counts for id " + id + "\n");
            
            updateCounts();
        },

    };
}

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