if (typeof com == "undefined") {
  var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

com.sppad.booky.BookmarksView = new function() {
    
    var self = this;
    
    this.setup = function(aWindow, aLauncher) {
        self.window = aWindow;
        self.document = aWindow.document;
        self.launcher = aLauncher;
        
        self.container =  self.document.getElementById('bookmarks_content');
        self.container.addEventListener('blur', self.blur, false);
        self.container.addEventListener('keyup', self.keyup, false);
        self.container.addEventListener('dragstart', self.dragstart, true);
        self.container.addEventListener('dragover', self.dragoverEmpty, true);
        self.container.addEventListener('drop', self.drop, true);
        
        self.context = self.document.getElementById('bookmarks_context');
        self.context.js = self;
        
        self.launcher.addListener(self.bookmarkEvent, com.sppad.booky.Launcher.BOOKMARKS_CHANGED);
    };
    
    this.cleanup = function() {
        self.launcher.removeListener(self.bookmarkEvent, com.sppad.booky.Launcher.BOOKMARKS_CHANGED);
    };
    
    this.bookmarkEvent = function() {
        self.loadItems();
    };
    
    this.loadItems = function() {
        
        while(self.container.hasChildNodes())
            self.container.removeChild(self.container.lastChild);
        
        let bookmarks = com.sppad.booky.Bookmarks.getBookmarks(self.launcher.id);
        for(let i=0; i<bookmarks.length; i++) {
            let bookmark = bookmarks[i];
            
            let item = self.document.createElement('listitem');
            item.bookmark = bookmark;
            item.setAttribute('class', 'listitem-iconic');
            item.setAttribute('label', bookmark.title || bookmark.uri);
            item.setAttribute('image', bookmark.icon);
            item.setAttribute('tooltiptext', bookmark.uri);
            
            item.addEventListener('dragover', self.dragover, true);
            item.addEventListener('dblclick', self.onAction.bind(self, i), false);
            
            self.container.appendChild(item);
        }
    };
    
    this.openUri = function(aUri) {
        gBrowser.selectedTab = gBrowser.loadOneTab(aUri);
    };
    
    this.blur = function() {
        self.container.selectedIndex = -1;
    };
    

    this.dragstart = function(aEvent) {
        let dt = aEvent.dataTransfer;
        let items = self.container.childNodes;
        let selectedItems = self.container.selectedItems;
        
        let itemIds = selectedItems.map(function(item) { return item.bookmark.itemId }).join('\n');
        dt.setData('text/com-sppad-booky-itemIds', itemIds);
        
        self.dragValid = false;
        
        /*
         * XXX - total hack - Can't add multiple elements, so normally can only
         * have one showing as the drag image. Too lazy to actually implement
         * drawing selected items on canvas. Instead, hide everything but the
         * selected items, cause the preview to be generated, then unhide them.
         */
        for(let i=0; i<items.length; i++)
            !items[i].selected && (items[i].style.visibility = 'hidden');
        
        dt.addElement(self.container);
        
        window.setTimeout(function() {
            for(let i=0; i<items.length; i++)
                items[i].style.visibility = '';
        }, 1);
    };
    
    this.dragover = function(aEvent) {
        self.handleDrag(aEvent, aEvent.target);
    };
    
    this.dragoverEmpty = function(aEvent) {
        self.handleDrag(aEvent, null);
    };
    
    this.handleDrag = function(aEvent, aTarget) {
        if(!aEvent.dataTransfer.getData('text/com-sppad-booky-itemIds'))
            return;
        
        self.dragValid = true;
        self.dragTarget = aTarget;
        aEvent.preventDefault();
    };
    
    this.drop = function(aEvent) {
        if(!self.dragValid)
            return;
        
        let dt = aEvent.dataTransfer;
        let data = dt.getData('text/com-sppad-booky-itemIds');
        
        if(!data)
            return;
        
        let prevItemId = self.dragTarget ? self.dragTarget.bookmark.itemId : null;
        let itemIds = data.split("\n");
        
        if(prevItemId)
            itemIds.reverse();
            
        for(let i=0; i<itemIds.length; i++)
            com.sppad.booky.Bookmarks.moveBefore(prevItemId, itemIds[i], self.launcher.id);
        
        aEvent.preventDefault();
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
           
    };
    
    this.onOpen = function() {
        
        let count = self.container.selectedItems.length;
        for(let i=0; i<count; i++) {
            let uri = self.container.selectedItems[i].bookmark.uri;
            self.openUri(uri);
        }
        
    };
    
    this.keyup = function(aEvent) {
        
        switch(aEvent.keyCode) {
            case KeyEvent.DOM_VK_RETURN:
                self.onAction();
                break;
            case KeyEvent.DOM_VK_DELETE:
                self.onDelete();
                break;
            case KeyEvent.DOM_VK_ESCAPE:
                self.blur();
                break;
            default:
                break;
        }
        
    };
    
    this.popupShowing = function() {
        let removeItem = self.document.getElementById('bookmarks_context_remove');
        removeItem.setAttribute('disabled', self.container.selectedCount == 0);
        
        let openItem = self.document.getElementById('bookmarks_context_open');
        openItem.setAttribute('disabled', self.container.selectedCount == 0);
    };
};