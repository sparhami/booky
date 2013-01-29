if (typeof com == "undefined") {
  var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

com.sppad.booky.TabsView = new function() {
    
    var self = this;
    
    this.setup = function(aDocument) {
        self.document = aDocument;
        
        self.container = aDocument.getElementById('tabs_content');
        self.container.addEventListener('blur', self.containerBlur, false);
        self.container.addEventListener('keyup', self.keyEvent, false);
        
        self.context = aDocument.getElementById('tabs_context');
        self.context.js = self;
    };
    
    this.setLauncher = function(aLauncher) {
        self.launcher = aLauncher;
    };
    
    this.loadItems = function() {
        
        while(self.container.hasChildNodes())
            self.container.removeChild(self.container.lastChild);
        
        let tabs = self.launcher.tabs;
        for(let i=0; i<tabs.length; i++) {
            let tab = tabs[i];
            
            let item = self.document.createElement('listitem');
            item.tab = tab;
            item.setAttribute('class', 'listitem-iconic');
            item.setAttribute('label', tab.label);
            item.setAttribute('image', tab.getAttribute('image'));
            
            item.addEventListener('dblclick', self.onAction.bind(self, i), true);
            
            self.container.appendChild(item);
        }
    };
    
    this.openTab = function(aTab) {
        gBrowser.selectedTab = aTab;
    };
    
    this.closeTab = function(aTab) {
        gBrowser.removeTab(aTab);
    };
    
    this.containerBlur = function() {
        self.container.selectedIndex = -1;
    };
    
    this.onAction = function(aIndex) {
        if(aIndex == undefined && self.container.selectedCount != 1)
            return;
            
        let index = aIndex || self.container.selectedIndex;
        let tab = self.container.getItemAtIndex(index).tab;
        gBrowser.selectedTab = tab;
    };
    
    this.onDelete = function() {
        
        let count = self.container.selectedItems.length;
        for(let i=0; i<count; i++) {
            let tab = self.container.selectedItems[i].tab;
            gBrowser.removeTab(tab);
        }
        
        self.loadItems();
    };
    
    this.keyEvent = function(aEvent) {
        
        switch(aEvent.keyCode) {
            case KeyEvent.DOM_VK_RETURN:
                self.onAction();
                break;
            case KeyEvent.DOM_VK_DELETE:
                self.onDelete();
                break;
            default:
                break;
        }
        
    };
    
    this.popupShowing = function() {
        let removeItem = self.document.getElementById('tabs_context_remove');
        
        removeItem.setAttribute('disabled', self.container.selectedCount == 0);
    };
};