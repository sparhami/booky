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
    
    var getUris = function(event) {
        let mozUrl = event.dataTransfer.getData('text/x-moz-url');
        let uriList = event.dataTransfer.getData('text/uri-list');
        let plain = event.dataTransfer.getData('text/plain');
        let uris = [];
        
        if(mozUrl) {
            com.sppad.Utils.dump("mozUrl " + mozUrl + "\n");
            let parts = mozUrl.split('\n');
            for(let i=0; i<parts.length; i+=2)
                uris.push(parts[i]);
        } else if(uriList) {
            com.sppad.Utils.dump("uriList " + uriList + "\n");
            let parts = uriList.split('\n');
            for(let i=0; i<parts.length; i++)
                if(parts[i].indexOf('#') != 0)
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
            let obj = event.target;
            let ind = getIndicator();

            showIndicator();
            event.preventDefault();
            
            // There may be gaps where there isn't a xstabgroup. In that case,
            // do not modify the ind location.
            if (obj.nodeName != 'launcher')
                return;

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
            dump("drop\n");

            hideIndicator();

            let uris = getUris(event);
            
            com.sppad.Utils.dump("uris.length " + uris.length + "\n");
            for(let i=0; i<uris.length; i++)
                com.sppad.Utils.dump("got uri " + uris[i] + "\n");
            
            for(let i=0; i<uris.length; i++) {
                
                let uri = uris[i];
                let id = com.sppad.Booky.getIdFromUriString(uri);

                let launcher = com.sppad.Launcher.getLauncher(id);
                if(launcher.getBookmarkIds().length == 0) {
                    com.sppad.Utils.dump("adding bookmark " + uris[i] + "\n");
                    com.sppad.Bookmarks.addBookmark(uris[i]);
                }
                
                let bookmarkIds = launcher.getBookmarkIds();
                let prevBookmarkIds = _insertPoint && _insertPoint.js.getBookmarkIds();

                com.sppad.Bookmarks.moveBookmarkGroupBefore(prevBookmarkIds, bookmarkIds);
            }
            
            dump("done drop\n");
        },

        dragend : function(event) {
            hideIndicator();
        },
        
    }
})();


window.addEventListener("load", function() {

    let launcherContainer = this.document.getElementById('com_sppad_booky_launchers');
    launcherContainer.addEventListener('dragover', com.sppad.dd.dragover, false);
    launcherContainer.addEventListener('dragend', com.sppad.dd.dragend, false);
    launcherContainer.addEventListener('drop', com.sppad.dd.drop, false);
    
    let noLaunchersContainer = this.document.getElementById('com_sppad_booky_noLaunchersArea');
    noLaunchersContainer.addEventListener('drop', com.sppad.dd.drop, false);
    noLaunchersContainer.addEventListener('dragover', com.sppad.dd.dragoverNoLaunchers, false);
    
}, false);
