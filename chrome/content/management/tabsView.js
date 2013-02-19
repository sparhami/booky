if (typeof com == "undefined") {
  var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

com.sppad.booky.TabsView = new function() {
    
    var self = this;
    
    /** The events to listen to the launcher for */
    self.tabEvents = [ com.sppad.booky.Launcher.TABS_ADDED,
                       com.sppad.booky.Launcher.TABS_MOVED,
                       com.sppad.booky.Launcher.TABS_REMOVED ];
    
    
    this.setup = function(aWindow, aLauncher) {
        self.window = aWindow;
        self.document = aWindow.document;
        self.launcher = aLauncher;
        
        self.container = self.document.getElementById('tabs_content');
        self.container.addEventListener('blur', self.blur, false);
        self.container.addEventListener('keyup', self.keyup, false);
        
        self.context = self.document.getElementById('tabs_context');
        self.context.js = self;
        
        self.launcher.addListener(self.tabEvent, self.tabEvents);
    };
    
    this.cleanup = function() {
        self.launcher.removeListener(self.tabEvent, self.tabEvents);
    };
    
    /**
     * Handles a tab event by adjusting the tabs shown in the view.
     */
    this.tabEvent = function(aEvent) {
        self.loadItems();
    };

    /**
     * Loads the items into the view. Creates a list item for each tab.
     */
    this.loadItems = function() {
        window.setTimeout(function() {
            while(self.container.hasChildNodes())
                self.container.removeChild(self.container.lastChild);
            
            let tabs = self.launcher.tabs;
            for(let i=0; i<tabs.length; i++) {
                let tab = tabs[i];
                
                let item = self.document.createElement('listitem');
                item.tab = tab;
                item.setAttribute('class', 'listitem-iconic');
                item.setAttribute('crop', 'right');
                item.setAttribute('label', tab.label);
                item.setAttribute('image', tab.getAttribute('image'));
                
                item.addEventListener('dblclick', self.action, true);
                
                self.container.appendChild(item);
            }
        }, 1);
    };
    
    /**
     * Handle loss of focus by clearing the selected items. Occurs through
     * escape key or by clicking off the view.
     */
    this.blur = function() {
        self.container.selectedIndex = -1;
    };
    
    /**
     * Handles commands and double-clicks by switching to the selected tab.
     */
    this.action = function() {
        if(self.container.selectedCount != 1)
            return;
            
        let tab = self.container.getItemAtIndex(self.container.selectedIndex).tab;
        gBrowser.selectedTab = tab;
    };
    
    /**
     * Closes all selected items tabs.
     */
    this.remove = function() {
        
        let count = self.container.selectedItems.length;
        for(let i=0; i<count; i++) {
            let tab = self.container.selectedItems[i].tab;
            gBrowser.removeTab(tab);
        }
        
    };
    
    this.open = function() {
        
        let count = self.container.selectedItems.length;
        for(let i=0; i<count; i++) {
            let tab = self.container.selectedItems[i].tab;
            gBrowser.selectedTab = tab;
        }
        
    };
    
    this.keyup = function(aEvent) {
        
        switch(aEvent.keyCode) {
            case KeyEvent.DOM_VK_RETURN:
                self.action();
                break;
            case KeyEvent.DOM_VK_DELETE:
                self.remove();
                break;
            case KeyEvent.DOM_VK_ESCAPE:
                self.blur();
                break;
            default:
                break;
        }
        
    };
    
    this.popupShowing = function() {
        let removeItem = self.document.getElementById('tabs_context_remove');
        removeItem.setAttribute('disabled', self.container.selectedCount == 0);
        
        let openItem = self.document.getElementById('tabs_context_open');
        openItem.setAttribute('disabled', self.container.selectedCount != 1);
    };
};