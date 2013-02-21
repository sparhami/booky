if (typeof com == "undefined") {
  var com = {};
}

com.sppad = com.sppad || {};
com.sppad.collections = com.sppad.collections || {};

/**
 * Array based map. TODO - need something better.
 */
com.sppad.collections.Map = function() {
    
    var self = this;
    
    self._keys = new Array();
    self._values = new Array();
    
    /**
     * Checks whether the map contains a given key.
     * 
     * @param key
     *            The key to look for
     * @return True if the map contains the key, false otherwise
     */
    this.containsKey = function(key) {
        return com.sppad.booky.Utils.getIndexInArray(self._keys, key) >= 0;
    };
    
    /**
     * Gets the value corresponding to a given key.
     * 
     * @param key
     *            The key to look for
     * @param defaultValue
     *            The value to return if the map does not contain a mapping
     * @return The value if the map contains the mapping, defaultValue otherwise
     */
    this.get = function(key, defaultValue) {
        let index = com.sppad.booky.Utils.getIndexInArray(self._keys, key);
        
        return index >= 0 ? self._values[index] : defaultValue;
    };
    
    /**
     * Adss a key, value mapping to the map.
     * 
     * @param key
     *            The key for the mapping
     * @param value
     *            The value for the mapping
     * @return The previously mapped value for the key
     */
    this.put = function(key, value) {
        let index = com.sppad.booky.Utils.getIndexInArray(self._keys, key);
        
        if(index >= 0) {
            let old = self._values[index];
            self._values[index] = value;
            
            return old;
        } else {
            self._keys.push(key);
            self._values.push(value);
            
            return null;
        }
    };
    
    /**
     * Removes an item from the map.
     * 
     * @param The
     *            key to remove from the map
     * @return The value corresponding to the key
     */
    this.remove = function(key) {
        let index = com.sppad.booky.Utils.getIndexInArray(self._keys, key);

        if(index >= 0) {
            self._keys.splice(index, 1);
            return self._values.splice(index, 1)[0];
        } else {
            return null;
        }
    };
    
    /**
     * @return An array containing the values in the map.
     */
    this.values = function() {
        return [].concat(self._values);
    };

    /**
     * @return The number of elements in the map.
     */
    this.size = function() {
        return this._keys.length;
    };
    
    /**
     * @return A string representation of the map.
     */
    this.toString = function() {
        let result = "[ ";
        
        for(let i=0; i<self._keys.length; i++) {
            result += self._keys[i] + " -> " + self._values[i] + ", \n";
        }
        
        result += "]";
        return result;
    };
}