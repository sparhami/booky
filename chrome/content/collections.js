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
    
    self.keys = new Array();
    self.values = new Array();
    
    this.containsKey = function(key) {
        return com.sppad.booky.Utils.getIndexInArray(self.keys, key) >= 0;
    };
    
    this.get = function(key, defaultValue) {
        let index = com.sppad.booky.Utils.getIndexInArray(self.keys, key);
        
        return index >= 0 ? self.values[index] : defaultValue;
    };
    
    this.put = function(key, value) {
        let index = com.sppad.booky.Utils.getIndexInArray(self.keys, key);
        
        if(index >= 0) {
            let old = self.values[index];
            self.values[index] = value;
            
            return old;
        } else {
            self.keys.push(key);
            self.values.push(value);
            
            return null;
        }
    };
    
    this.remove = function(key) {
        let index = com.sppad.booky.Utils.getIndexInArray(self.keys, key);

        if(index >= 0) {
            self.keys.splice(index, 1);
            return self.values.splice(index, 1)[0];
        } else {
            return null;
        }
    };
    
    this.size = function() {
        return this.keys.length;
    };
    
    this.toString = function() {
        
        let result = "[ ";
        for(let i=0; i<self.keys.length; i++) {
            result += self.keys[i] + " -> " + self.values[i] + ", \n";
        }
        
        result += "]";
        return result;
    };
}