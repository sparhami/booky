if (typeof com == "undefined") {
  var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

com.sppad.booky.DragDrop = new function() {
    
    let self = this;
    
    /** The current insert point, used when dropping */
    self._insertPoint = null;
    self._insertValid = false;
    self._menuIndicator = null;
    self._toolbarIndicator = null;
    self.overflowMenuCloseEventId = null;
    
    self._overflowButton = null;
    self._launcherContainer = null;
    self._overflowContainer = null;
    self._noLaunchersContainer = null;
    
    self._canDrop = function(event) {
        let dt = event.dataTransfer;
        let mozUrl = dt.getData('text/x-moz-url');
        let uriList = dt.getData('text/uri-list');
        let plain = dt.getData('text/plain');
        let internal = dt.getData('text/x-moz-text-internal');
        
        if(mozUrl || uriList || plain || internal)
            return true;
        else
            return false;
    };
    
    self._getUris = function(event) {
        
        let dt = event.dataTransfer;
        let mozUrl = dt.getData('text/x-moz-url');
        let uriList = dt.getData('text/uri-list');
        let plain = dt.getData('text/plain');
        let internal = dt.getData('text/x-moz-text-internal');
        let uris = [];
        
        if(uriList) {
            com.sppad.booky.Utils.dump("uriList " + uriList + "\n");
            let parts = uriList.split('\n');
            for(let i=0; i<parts.length; i++)
                if(parts[i].indexOf('#') != 0)
                    uris.push(parts[i]);
        } else if(internal) {
            com.sppad.booky.Utils.dump("internal " + internal + "\n");
            let parts = internal.split('\n');
            for(let i=0; i<parts.length; i++)
                uris.push(parts[i]);
        } else if(plain) {
            com.sppad.booky.Utils.dump("plain " + plain + "\n");
            let parts = plain.split('\n');
            for(let i=0; i<parts.length; i++)
                uris.push(parts[i]);
        }
        
        return uris;
    };
    
    self._closeOverflowMenu = function() {
        self._overflowButton.open = false;
    };
    
    return {
        /**
         * Sets the insertion point for a subsequent drop event along with the
         * tab drop location ind. This code checks to see if the mouse is either
         * before or past the midway point of a given tab and positions the ind
         * before or after, respectively.
         */
        dragoverLaunchers : function(event) {
            if(!self._canDrop(event))
                return;
            
            event.preventDefault();
            
            // There may be gaps where there isn't a launcher. In that case,
            // do not modify the indicator location.
            let obj = event.target;
            if (obj.nodeName != 'launcher')
                return;
            
            self._toolbarIndicator.collapsed = false;

            let ps = obj.boxObject.previousSibling;
            let locX = 0, locY = 0;
            let rect = obj.getBoundingClientRect();

            if (event.clientX > (rect.left + rect.right) / 2) {
                locX = rect.left;
                self._insertPoint = obj;
            } else {
                // May not have a previous sibling, in which case need to
                // position accordingly
                locX = ps ? ps.getBoundingClientRect().left : rect.left
                        - rect.width;
                self._insertPoint = ps;
            }

            locY = rect.bottom;
            locX += 2 * self._toolbarIndicator.clientWidth;
            let xform = "matrix(1, 0, 0, 1,";

            self._toolbarIndicator.style.MozTransform = xform + locX + "px, " + locY + "px)";
            self._insertValid = true;
        },
        
        dragoverMenuLaunchers : function(event) {
            if(self.overflowMenuCloseEventId)
                window.clearTimeout(self.overflowMenuCloseEventId);

            if(!self._canDrop(event))
                return;
            
            event.preventDefault();
            
            // There may be gaps where there isn't a launcher. In that case,
            // do not modify the indicator location.
            let obj = event.target;
            if (obj.nodeName != 'menu')
                return;
            
            self._menuIndicator.collapsed = false;
            
            let ps = obj.boxObject.previousSibling;
            let locX = 0, locY = 0;
            let rect = obj.getBoundingClientRect();
            
            if (event.clientY > (rect.top + rect.bottom) / 2) {
                locY = rect.top;
                self._insertPoint = obj;
            } else {
                locY = ps ? ps.getBoundingClientRect().top : rect.top
                        - rect.height;
                self._insertPoint = ps;
            }
            
            locX = rect.left - 1.5 * self._menuIndicator.clientWidth;
            locY += 1.5 * self._menuIndicator.clientHeight;
            let xform = "matrix(0, 1, -1, 0,";
            
            self._menuIndicator.style.MozTransform = xform + locX + "px, " + locY + "px)";
            self._insertValid = true;
        },
        
        dragexitMenuLaunchers : function(event) {
            window.clearTimeout(self.overflowMenuCloseEventId);
            self.overflowMenuCloseEventId = window.setTimeout( function() { self._closeOverflowMenu(); } , 650);
           
            self._menuIndicator.collapsed = true;
        },
  
        
        dragoverMenuButton : function(event) {
            if(self.overflowMenuCloseEventId)
                window.clearTimeout(self.overflowMenuCloseEventId);
            
            if(!self._canDrop(event))
                return;
            
            if(self._overflowButton.open)
                return;
            
            event.preventDefault();
            self._overflowButton.open = true;
        },
        
        dragoverNoLaunchers : function(event) {
            event.preventDefault();
            self._insertValid = true;
        },
        
        drop : function(event) {
            if(!self._insertValid) {
                com.sppad.booky.Utils.dump("Not a valid target to drop.\n");
                return;
            }
     
            self._menuIndicator.collapsed = true;
            self._toolbarIndicator.collapsed = true;
            
            let uris = self._getUris(event);
            for(let i=0; i<uris.length; i++) {
                
                let uri = uris[i];
                let id = com.sppad.booky.Booky.getIdFromUriString(uri);

                let launcher = com.sppad.booky.Launcher.getLauncher(id);
                if(com.sppad.booky.Utils.getIndexInArray(launcher.bookmarks, uri) < 0)
                    com.sppad.booky.Bookmarks.addBookmark(uri);
                
                let bookmarkIDs = launcher.bookmarkIDs;
                let prevBookmarkIDs = self._insertPoint && self._insertPoint.js.bookmarkIDs;

                com.sppad.booky.Bookmarks.moveBookmarkGroupBefore(prevBookmarkIDs, bookmarkIDs);
            }
            
            self._insertPoint = null;
            self._insertValid = true;
        },
        
        dragend : function(event) {
            self._menuIndicator.collapsed = true;
            self._toolbarIndicator.collapsed = true;
        },
        
        dragexit : function(event) {
            self._toolbarIndicator.collapsed = true;
        },

        setup: function() {
            self._menuIndicator = document.getElementById('com_sppad_booky_menuDropmarker');
            self._toolbarIndicator = document.getElementById('com_sppad_booky_toolbarDropmarker');
            
            self._overflowButton = document.getElementById('com_sppad_booky_launchers_overflow_button');
            self._overflowButton.addEventListener('dragover', com.sppad.booky.DragDrop.dragoverMenuButton, false);
            self._overflowButton.addEventListener('dragexit', com.sppad.booky.DragDrop.dragexitMenuLaunchers, false);
            
            self._launcherContainer = document.getElementById('com_sppad_booky_launchers');
            self._launcherContainer.addEventListener('dragover', com.sppad.booky.DragDrop.dragoverLaunchers, false);
            self._launcherContainer.addEventListener('dragend', com.sppad.booky.DragDrop.dragend, false);
            self._launcherContainer.addEventListener('dragexit', com.sppad.booky.DragDrop.dragexit, false);
            self._launcherContainer.addEventListener('drop', com.sppad.booky.DragDrop.drop, false);
            
            self._overflowContainer = document.getElementById('com_sppad_booky_launchers_overflow_menu');
            self._overflowContainer.addEventListener('dragover', com.sppad.booky.DragDrop.dragoverMenuLaunchers, false);
            self._overflowContainer.addEventListener('dragend', com.sppad.booky.DragDrop.dragend, false);
            self._overflowContainer.addEventListener('dragexit', com.sppad.booky.DragDrop.dragexitMenuLaunchers, false);
            self._overflowContainer.addEventListener('drop', com.sppad.booky.DragDrop.drop, false);
           
            self._noLaunchersContainer = document.getElementById('com_sppad_booky_noLaunchersArea');
            self._noLaunchersContainer.addEventListener('drop', com.sppad.booky.DragDrop.drop, false);
            self._noLaunchersContainer.addEventListener('dragover', com.sppad.booky.DragDrop.dragoverNoLaunchers, false);
        },
    }
};
