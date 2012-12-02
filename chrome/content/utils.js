if (typeof com == "undefined") {
  var com = {};
  if (typeof com.sppad == "undefined") {
      com.sppad = {};
    };
}

/**
 * A dreaded utils class, which contains odds and ends. Since we're not supposed
 * to use prototypes of built in types for extensions, prototype-y things go
 * here as well.
 */
com.sppad.Utils = (function() {
	
	var debugEnabled = true;
	
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
		removeFromArray: function(array,  obj) {
			for( var i = 0; i < array.length; i++)
				if (array[i] == obj)
					return array.splice(i, 1);
			
			return null;
		},
		
        /**
         * Finds the index for a given object.
         * 
         * @param obj
         *            The object to locate.
         */
		getIndexInArray: function(array, obj) {
	          for(var i = 0; i < array.length; i++)
	              if (array[i] == obj)
                      return i;
              
	          return -1;
		},
	}
})();

/**
 * A very basic event support for firing off events to listeners. Listeners can
 * be either added as 'functions' or objects. If they are added as objects, then
 * the handleEvent function is called, bound to the object itself.
 */
com.sppad.EventSupport = function() {
	var _typeSpecificListeners = {};
	var _allTypeListeners = [];
	
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
            return _typeSpecificListeners[type] = _typeSpecificListeners[type] || [];
        else
            return _allTypeListeners;
    };
};

com.sppad.EventSupport.prototype.
addListener = function(listener, type) {
    this._getListeners(type).push(listener);
};

com.sppad.EventSupport.prototype.
fire = function(event, type) {
    event.type = type;

    this._fireForListeners(event, this._getListeners(type));
    this._fireForListeners(event, this._getListeners());
};  

com.sppad.EventSupport.prototype.
removeListener = function(listener, type) {
    com.sppad.Utils.removeFromArray(this._getListeners(type), listener);
};