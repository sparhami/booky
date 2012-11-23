var com = com || {};
com.sppad = com.sppad || {};

com.sppad.Resizer = (function() {

    var _launchers;
    var _lastResizeTime;
    var _resizeEventId = null;

    var _doresize = function() {
        let windowSize = window.innerWidth;
        let launchersSizePercentage = Math.min(CurrentPrefs['maxWidth'], 100) / 100;
        
        let newWidth = windowSize * launchersSizePercentage;
        if(newWidth == _launchers.maxWidth)
            return;
        
        _lastResizeTime = Date.now();
        _launchers.maxWidth = newWidth;
        
        let boxEnd = _launchers.getBoundingClientRect().right;
        let children = _launchers.children;
        
        let hasOverflow = false;
        for (let i=0; i < children.length; i++) {
            let overflow = children[i].getBoundingClientRect().right > boxEnd;
            hasOverflow |= overflow;
            
            children[i].js.setOverflow(overflow);
        }
            
        _overflowToolbarButton.setAttribute('vCollapse', !hasOverflow);
    };

    return {

        onresize : function() {
            window.clearTimeout(_resizeEventId);

            // If it has been more than 100ms, resize now, otherwise schedule
            // again
            if (Date.now() - _lastResizeTime > 100)
                _doresize();
            else
                _resizeEventId = window.setTimeout(_doresize, 100);
        },

        setup : function() {

            _launchers = window.document.getElementById('com_sppad_booky_launchers');
            _overflowToolbarButton = window.document.getElementById('com_sppad_booky_launchers_overflow');
            window.addEventListener('resize', this.onresize, false);

            _doresize();
        },

    }
})();

window.addEventListener("load", function() {
    com.sppad.Resizer.setup();
}, false);