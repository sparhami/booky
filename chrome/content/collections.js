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
    
    this.containsKey = function(key) {
        return com.sppad.booky.Utils.getIndexInArray(self._keys, key) >= 0;
    };
    
    this.get = function(key, defaultValue) {
        let index = com.sppad.booky.Utils.getIndexInArray(self._keys, key);
        
        return index >= 0 ? self._values[index] : defaultValue;
    };
    
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
    
    this.remove = function(key) {
        let index = com.sppad.booky.Utils.getIndexInArray(self._keys, key);

        if(index >= 0) {
            self._keys.splice(index, 1);
            return self._values.splice(index, 1)[0];
        } else {
            return null;
        }
    };
    
    this.values = function() {
        return [].concat(self._values);
    };
    
    this.size = function() {
        return this._keys.length;
    };
    
    this.toString = function() {
        let result = "[ ";
        
        for(let i=0; i<self._keys.length; i++) {
            result += self._keys[i] + " -> " + self._values[i] + ", \n";
        }
        
        result += "]";
        return result;
    };
}