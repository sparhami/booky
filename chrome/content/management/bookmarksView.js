if (typeof com == "undefined") {
  var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

com.sppad.booky.BookmarksView = new function() {
    
    var self = this;
    
    this.setup = function(aDocument) {
        self.document = aDocument;
        
        self.container = aDocument.getElementById('bookmarks_content');
        self.container.addEventListener('blur', self.containerBlur, false);
        self.container.addEventListener('keyup', self.keyEvent, false);
        
        self.context = aDocument.getElementById('bookmarks_context');
        self.context.js = self;
    };
    
    this.setLauncher = function(aLauncher) {
        self.launcher = aLauncher;
    };
    
    this.loadItems = function() {
        
        while(self.container.hasChildNodes())
            self.container.removeChild(self.container.lastChild);
        
        let bookmarks = self.launcher.bookmarks;
        for(let i=0; i<bookmarks.length; i++) {
            let bookmark = bookmarks[i];
            
            let item = self.document.createElement('listitem');
            item.bookmark = bookmark;
            item.setAttribute('class', 'listitem-iconic');
            item.setAttribute('label', bookmark.title || bookmark.uri);
            item.setAttribute('image', bookmark.icon);
            item.setAttribute('tooltiptext', bookmark.uri);
            
            item.addEventListener('dblclick', self.onAction.bind(self, i), true);
            
            self.container.appendChild(item);
        }
    };
    
    this.openUri = function(aUri) {
        gBrowser.selectedTab = gBrowser.loadOneTab(aUri);
    };
    
    this.containerBlur = function() {
        self.container.selectedIndex = -1;
    };
    
    this.onAction = function(aIndex) {
        if(aIndex == undefined && self.container.selectedCount != 1)
            return;
            
        let index = aIndex || self.container.selectedIndex;
        let uri = self.container.getItemAtIndex(index).bookmark.uri;
        gBrowser.selectedTab = gBrowser.loadOneTab(uri);
    };
    
    this.onDelete = function() {
        
        let count = self.container.selectedItems.length;
        for(let i=0; i<count; i++) {
            let itemId = self.container.selectedItems[i].bookmark.itemId;
            com.sppad.booky.Bookmarks.removeBookmark(itemId);
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
        let removeItem = self.document.getElementById('bookmarks_context_remove');
        
        removeItem.setAttribute('disabled', self.container.selectedCount == 0);
    };
};