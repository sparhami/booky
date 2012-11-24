var com = com || {};
com.sppad = com.sppad || {};

com.sppad.dd = (function() {
    /** The current insert point, used when dropping */
    var _insertPoint = null;
    var _indicator = null;
    
    var getIndicator = function() {
        if(_indicator == null)
            _indicator = document.getElementById('com_sppad_booky_dropmarker');
        
        return _indicator;
    };
    
    var showIndicator = function() {
        getIndicator().collapsed = false;
    };
    
    var hideIndicator = function() {
        getIndicator().collapsed = true;
    };
    
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
    
    return {
        /**
         * Sets the insertion point for a subsequent drop event along with the
         * tab drop location ind. This code checks to see if the mouse is either
         * before or past the midway point of a given tab and positions the ind
         * before or after, respectively.
         */
        dragover : function(event) {
            dump('dragover dd\n');
            
            if(!canDrop(event))
                return;
            
            event.preventDefault();
            
            // There may be gaps where there isn't a launcher. In that case,
            // do not modify the indicator location.
            let obj = event.target;
            if (obj.nodeName != 'launcher')
                return;
            
            let ind = getIndicator();
            showIndicator();

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
            locX += 2 * ind.clientWidth;
            let xform = "matrix(1, 0, 0, 1,";

            ind.style.MozTransform = xform + locX + "px, " + locY + "px)";
        },
        
        dragoverNoLaunchers : function(event) {
            event.preventDefault();
        },
        
        drop : function(event) {
            hideIndicator();
            
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
        },

        dragend : function(event) {
            hideIndicator();
        },
        
        dragexit : function(event) {
            hideIndicator();
        },
    }
})();


window.addEventListener("load", function() {

    let launcherContainer = this.document.getElementById('com_sppad_booky_launchers');
    launcherContainer.addEventListener('dragover', com.sppad.dd.dragover, false);
    launcherContainer.addEventListener('dragend', com.sppad.dd.dragend, false);
    launcherContainer.addEventListener('dragexit', com.sppad.dd.dragexit, false);
    launcherContainer.addEventListener('drop', com.sppad.dd.drop, false);
    
    let overflowContainer = this.document.getElementById('com_sppad_booky_launchers_overflow_menu');
    overflowContainer.addEventListener('dragover', com.sppad.dd.dragover, false);
    overflowContainer.addEventListener('dragend', com.sppad.dd.dragend, false);
    overflowContainer.addEventListener('dragexit', com.sppad.dd.dragexit, false);
    overflowContainer.addEventListener('drop', com.sppad.dd.drop, false);
    
    let noLaunchersContainer = this.document.getElementById('com_sppad_booky_noLaunchersArea');
    noLaunchersContainer.addEventListener('drop', com.sppad.dd.drop, false);
    noLaunchersContainer.addEventListener('dragover', com.sppad.dd.dragoverNoLaunchers, false);
    
}, false);
