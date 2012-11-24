var com = com || {};
com.sppad = com.sppad || {};

com.sppad.Resizer = (function() {

    const RESIZE_MAX_PERIOD = 100;
    
    var _launchers;
    var _lastResizeTime;
    var _resizeEventId = null;

    var _doresize = function() {
        let windowSize = window.innerWidth;
        let launchersSizePercentage = Math.min(CurrentPrefs['maxWidth'], 100) / 100;
        
        _lastResizeTime = Date.now();
        _launchers.maxWidth = windowSize * launchersSizePercentage;
        
        let boxEnd = _launchers.getBoundingClientRect().right;
        let children = _launchers.children;
        
        let hasOverflow = false;
        for (let i=0; i < children.length; i++) {
            let overflow = children[i].getBoundingClientRect().right > boxEnd;
            hasOverflow |= overflow;
            
            children[i].js.setOverflow(overflow);
        }
            
        _overflowToolbarButton.setAttribute('overflow', hasOverflow == true);
    };

    return {

        onresize : function() {
            window.clearTimeout(_resizeEventId);

            // Resize at most once every 100 ms
            let timeSinceResize = Date.now() - _lastResizeTime;
            if (timeSinceResize > RESIZE_MAX_PERIOD)
                _doresize();
            else
                _resizeEventId = window.setTimeout(_doresize, RESIZE_MAX_PERIOD - timeSinceResize);
        },

        setup : function() {

            _launchers = window.document.getElementById('com_sppad_booky_launchers');
            _overflowToolbarButton = window.document.getElementById('com_sppad_booky_launchers_overflow_button');
            window.addEventListener('resize', this.onresize, false);

            _doresize();
        },

    }
})();

window.addEventListener("load", function() {
    com.sppad.Resizer.setup();
}, false);
