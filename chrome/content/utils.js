if (typeof com == "undefined") {
  var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

/**
 * A dreaded utils class, which contains odds and ends. Since we're not supposed
 * to use prototypes of built in types for extensions, prototype-y things go
 * here as well.
 */
com.sppad.booky.Utils = (function() {
	
	let debugEnabled = true;
	
	return {
		
		/**
         * Sets the debug flag, used to determine whether or not to dump info.
         * 
         * @param enable
         *            Enables dump statements if true, disables otherwise.
         */
		enableDebug: function(enable) {
			debugEnabled = enable ? true : false;
		},
	
		/**
         * Dumps a message, if debug is enabled. TODO - find out if there is
         * some sort of string formatter function that can be used.
         * 
         * @param messageString
         *            The messageString to dump out.
         */
		dump: function(messageString) {
			if(debugEnabled)
				dump(messageString);
		},
		
		/**
         * Dumps an object, if debug is enabled.
         * 
         * @param object
         *            The object to dump out.
         */
		dumpObject: function(object) {
			if(debugEnabled) {
				var output = '';
				for (property in object) {
					output += property + ': ' + object[property] + '; \n';
				}

				dump(output);
			}
		},

		/**
         * Removes all children from the given node.
         * 
         * @param node
         *            The node to remove from
         */
		removeAllChildren: function(node) {
			while (node.childNodes.length >= 1)
				node.removeChild(node.firstChild);
		},
		
		
		/**
         * Removes the first instance of an object in the array
         * 
         * @param obj
         *            The object to remove from the array
         */
		removeFromArray: function(array, obj) {
			for(let i = 0; i < array.length; i++)
				if (array[i] == obj)
					return array.splice(i, 1);
			
			return null;
		},
		
        /**
         * Finds the index for a given object.
         * 
         * @param obj
         *            The object to locate.
         * 
         * @return -1 if the object does not exist in the array, the index it
         *         occurs at otherwise
         */
		getIndexInArray: function(array, obj) {
	          for(let i = 0; i < array.length; i++)
	              if (array[i] == obj)
                      return i;
              
	          return -1;
		},
        
        /**
         * Tab previews utility, produces thumbnails. Code based on browser.js
         * tabPreviews. Unlike the Firefox function, it uses the full window of
         * the tab to generate a preview rather than just a upper left portion.
         * 
         * @param aTab
         *            The tab to generate a preview for
         * @param width
         *            The width of the preview
         * @param height
         *            The height of the preview
         * @return A canvas element containing the tab preview
         */
        drawWindow: function(aTab, width, height) {
            let win = aTab.linkedBrowser.contentWindow;
            
            let aspectRatio = 0.5625; // 16:9
            let screen = win.screen;
                      
            let canvas = win.document.createElementNS("http://www.w3.org/1999/xhtml", "canvas");
            canvas.mozOpaque = true;
            canvas.height = height;
            canvas.width = width;

            let ctx = canvas.getContext("2d");
            /*
             * FIXME - window's innerWidth doesn't update instantly, which can
             * cause this to mess up if done too quickly after the window is
             * resized. This results in a black bar appearing on the right or
             * bottom of the preview.
             */
            let snippetWidth = win.innerWidth * 1.0;
            let snippetHeight = win.innerHeight * 1.0;
            let scaleWidth = width / snippetWidth;
            let scaleheight = height / snippetHeight;
            
            ctx.scale(scaleWidth, scaleheight);
            ctx.drawWindow(win, win.scrollX, win.scrollY,
                    snippetWidth, snippetHeight, "rgb(255,255,255)");

            return canvas;
        }
	}
})();

/**
 * A very basic event support for firing off events to listeners. Listeners can
 * be either added as 'functions' or objects. If they are added as objects, then
 * the handleEvent function is called, bound to the object itself.
 */
com.sppad.booky.EventSupport = function() {
    
    let self = this;
    
    self._typeSpecificListeners = {};
    self._allTypeListeners = [];
	
    this._fireForListeners = function(event, listeners) {
        for (let i=0; i < listeners.length; i++) {
            try {
                if (typeof(listeners[i]) == "function") {
                    listeners[i].call(this, event);
                } else {
                    /*
                     * TODO - just bind once when added, that is
                     * _listeners[type].push =
                     * listener.handleEvent.bind(listener).
                     */
                    listeners[i].handleEvent.bind(listeners[i]).call(this, event);
                }
            } catch(err) {
                // Make sure all other listeners still get to go
                dump("error while firing listener: " + err + "\n");
                dump(err.stack);
            }
        }
    };
	    
    this._getListeners = function(type) {
        if(type)
            return self._typeSpecificListeners[type] = self._typeSpecificListeners[type] || [];
        else
            return self._allTypeListeners;
    };
};

com.sppad.booky.EventSupport.prototype.
addListener = function(listener, type) {
    let types = (type instanceof Array) ? type : [ type ];
        
    for(let i=0; i<types.length; i++)
        this._getListeners(types[i]).push(listener);
};

com.sppad.booky.EventSupport.prototype.
fire = function(event, type) {
    event.type = type;

    this._fireForListeners(event, this._getListeners(type));
    this._fireForListeners(event, this._getListeners());
};  

com.sppad.booky.EventSupport.prototype.
removeListener = function(listener, type) {
    let types = (type instanceof Array) ? type : [ type ];
    
    for(let i=0; i<types.length; i++)
        com.sppad.booky.Utils.removeFromArray(this._getListeners(types[i]), listener);
};