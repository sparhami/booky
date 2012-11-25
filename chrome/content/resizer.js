var com = com || {};
com.sppad = com.sppad || {};

com.sppad.Resizer = (function() {

    const RESIZE_PERIOD = 100;
    
    var _launchers;
    var _overflowDecorator;
    var _overflowToolbarButton;
    
    var _lastResizeTime;
    var _resizeEventId = null;

    var _doResize = function() {
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
        _updateAttributes();
    };
    
    var _updateAttributes = function() {
        let selected = false;
        let titleChanged = false;
        let children = _launchers.children;
        
        for (let i=0; i < children.length; i++) {
            let child = children[i];
            
            if(child.getAttribute('overflow') != 'true')
                continue;
            
            selected |= child.getAttribute('selected') == 'true';
            titleChanged |= child.getAttribute('titleChanged') == 'true';
        }
        
        _overflowDecorator.setAttribute('selected', selected == true);
        _overflowDecorator.setAttribute('titleChanged', titleChanged == true);
    };

    return {

        onResize : function() {
            window.clearTimeout(_resizeEventId);

            // Resize at most once every 100 ms
            let timeSinceResize = Date.now() - _lastResizeTime;
            if (timeSinceResize > RESIZE_PERIOD)
                _doResize();
            else
                _resizeEventId = window.setTimeout(_doResize, RESIZE_PERIOD - timeSinceResize);
        },
        
        onTabSelect : function(aTab) {
            _updateAttributes();
        },
        
        onTabTitleChange : function(aTab) {
            _updateAttributes();
        },
        
        onTabTitleChangeCleared : function(aTab) {
            _updateAttributes();
        },
        
        
        setup : function() {
            
            _launchers = window.document.getElementById('com_sppad_booky_launchers');
            _overflowDecorator = window.document.getElementById('com_sppad_booky_launchers_overflow_decorator');
            _overflowToolbarButton = window.document.getElementById('com_sppad_booky_launchers_overflow_button');
            window.addEventListener('resize', this.onResize, false);

            _doResize();
        },

    }
})();

window.addEventListener("load", function() {
    com.sppad.Resizer.setup();
}, false);
