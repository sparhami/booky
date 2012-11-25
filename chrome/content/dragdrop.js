var com = com || {};
com.sppad = com.sppad || {};

com.sppad.dd = (function() {
    /** The current insert point, used when dropping */
    var _insertPoint = null;
    var _insertValid = false;
    var _menuIndicator = null;
    var _toolbarIndicator = null;
    var _overflowMenuCloseEventId = null;
    
    var _overflowButton = null;
    var _launcherContainer = null;
    var _overflowContainer = null;
    var _noLaunchersContainer = null;
    
    var canDrop = function(event) {
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
    
    var getUris = function(event) {
        
        let dt = event.dataTransfer;
        let mozUrl = dt.getData('text/x-moz-url');
        let uriList = dt.getData('text/uri-list');
        let plain = dt.getData('text/plain');
        let internal = dt.getData('text/x-moz-text-internal');
        let uris = [];
        
        if(uriList) {
            com.sppad.Utils.dump("uriList " + uriList + "\n");
            let parts = uriList.split('\n');
            for(let i=0; i<parts.length; i++)
                if(parts[i].indexOf('#') != 0)
                    uris.push(parts[i]);
        } else if(internal) {
            com.sppad.Utils.dump("internal " + internal + "\n");
            let parts = internal.split('\n');
            for(let i=0; i<parts.length; i++)
                uris.push(parts[i]);
        } else if(plain) {
            com.sppad.Utils.dump("plain " + plain + "\n");
            let parts = plain.split('\n');
            for(let i=0; i<parts.length; i++)
                uris.push(parts[i]);
        }
        
        return uris;
    };
    
    var _closeOverflowMenu = function() {
        _overflowButton.open = false;
    };
    
    return {
        /**
         * Sets the insertion point for a subsequent drop event along with the
         * tab drop location ind. This code checks to see if the mouse is either
         * before or past the midway point of a given tab and positions the ind
         * before or after, respectively.
         */
        dragoverLaunchers : function(event) {
            if(!canDrop(event))
                return;
            
            event.preventDefault();
            
            // There may be gaps where there isn't a launcher. In that case,
            // do not modify the indicator location.
            let obj = event.target;
            if (obj.nodeName != 'launcher')
                return;
            
            _toolbarIndicator.collapsed = false;

            // make sure to get ordinal sibling
            let ps = obj.boxObject.previousSibling;
            let locX = 0, locY = 0;
            let rect = obj.getBoundingClientRect();

            if (event.clientX > (rect.left + rect.right) / 2) {
                locX = rect.left;
                _insertPoint = obj;
            } else {
                // May not have a previous sibling, in which case need to
                // position accordingly
                locX = ps ? ps.getBoundingClientRect().left : rect.left
                        - rect.width;
                _insertPoint = ps;
            }

            locY = rect.bottom;
            locX += 2 * _toolbarIndicator.clientWidth;
            let xform = "matrix(1, 0, 0, 1,";

            _toolbarIndicator.style.MozTransform = xform + locX + "px, " + locY + "px)";
            _insertValid = true;
        },
        
        dragoverMenuLaunchers : function(event) {
            if(_overflowMenuCloseEventId)
                window.clearTimeout(_overflowMenuCloseEventId);

            if(!canDrop(event))
                return;
            
            event.preventDefault();
            
            // There may be gaps where there isn't a launcher. In that case,
            // do not modify the indicator location.
            let obj = event.target;
            if (obj.nodeName != 'menu')
                return;
            
            _menuIndicator.collapsed = false;
            
            // make sure to get ordinal sibling
            let ps = obj.boxObject.previousSibling;
            let locX = 0, locY = 0;
            let rect = obj.getBoundingClientRect();

            if (event.clientY > (rect.top + rect.bottom) / 2) {
                locY = rect.top;
                _insertPoint = obj;
            } else {
                locY = ps ? ps.getBoundingClientRect().top : rect.top
                        - rect.height;
                _insertPoint = ps;
            }
            
            locX = rect.left - 1.5 * _menuIndicator.clientWidth;
            locY += 1.5 * _menuIndicator.clientHeight;
            let xform = "matrix(0, 1, -1, 0,";
            
            _menuIndicator.style.MozTransform = xform + locX + "px, " + locY + "px)";
            _insertValid = true;
        },
        
        dragexitMenuLaunchers : function(event) {
            window.clearTimeout(_overflowMenuCloseEventId);
            _overflowMenuCloseEventId = window.setTimeout(_closeOverflowMenu, 650);
           
            _menuIndicator.collapsed = true;
        },
  
        
        dragoverMenuButton : function(event) {
            if(_overflowMenuCloseEventId)
                window.clearTimeout(_overflowMenuCloseEventId);
            
            if(!canDrop(event))
                return;
            
            if(_overflowButton.open)
                return;
            
            event.preventDefault();
            _overflowButton.open = true;
        },
        
        dragoverNoLaunchers : function(event) {
            event.preventDefault();
            _insertValid = true;
        },
        
        drop : function(event) {
            if(!_insertValid) {
                com.sppad.Utils.dump("Not a valid target to drop.\n");
                return;
            }
     
            _menuIndicator.collapsed = true;
            _toolbarIndicator.collapsed = true;
            
            let uris = getUris(event);
            for(let i=0; i<uris.length; i++) {
                
                let uri = uris[i];
                let id = com.sppad.Booky.getIdFromUriString(uri);

                let launcher = com.sppad.Launcher.getLauncher(id);
                if(com.sppad.Utils.getIndexInArray(launcher.bookmarks, uri) < 0)
                    com.sppad.Bookmarks.addBookmark(uri);
                
                let bookmarkIds = launcher.bookmarkIds;
                let prevBookmarkIds = _insertPoint && _insertPoint.js.bookmarkIds;

                com.sppad.Bookmarks.moveBookmarkGroupBefore(prevBookmarkIds, bookmarkIds);
            }
            
            _insertPoint = null;
            _insertValid = true;
        },

        dragend : function(event) {
            _menuIndicator.collapsed = true;
            _toolbarIndicator.collapsed = true;
        },
        
        dragexit : function(event) {
            _toolbarIndicator.collapsed = true;
        },

        setup: function() {
            _menuIndicator = document.getElementById('com_sppad_booky_menuDropmarker');
            _toolbarIndicator = document.getElementById('com_sppad_booky_toolbarDropmarker');
            
            _overflowButton = document.getElementById('com_sppad_booky_launchers_overflow_button');
            _overflowButton.addEventListener('dragover', com.sppad.dd.dragoverMenuButton, false);
            _overflowButton.addEventListener('dragexit', com.sppad.dd.dragexitMenuLaunchers, false);
            
            _launcherContainer = document.getElementById('com_sppad_booky_launchers');
            _launcherContainer.addEventListener('dragover', com.sppad.dd.dragoverLaunchers, false);
            _launcherContainer.addEventListener('dragend', com.sppad.dd.dragend, false);
            _launcherContainer.addEventListener('dragexit', com.sppad.dd.dragexit, false);
            _launcherContainer.addEventListener('drop', com.sppad.dd.drop, false);
            
            _overflowContainer = document.getElementById('com_sppad_booky_launchers_overflow_menu');
            _overflowContainer.addEventListener('dragover', com.sppad.dd.dragoverMenuLaunchers, false);
            _overflowContainer.addEventListener('dragend', com.sppad.dd.dragend, false);
            _overflowContainer.addEventListener('dragexit', com.sppad.dd.dragexitMenuLaunchers, false);
            _overflowContainer.addEventListener('drop', com.sppad.dd.drop, false);
           
            _noLaunchersContainer = document.getElementById('com_sppad_booky_noLaunchersArea');
            _noLaunchersContainer.addEventListener('drop', com.sppad.dd.drop, false);
            _noLaunchersContainer.addEventListener('dragover', com.sppad.dd.dragoverNoLaunchers, false);
        },
    }
})();


window.addEventListener("load", function() {
    com.sppad.dd.setup();
}, false);
