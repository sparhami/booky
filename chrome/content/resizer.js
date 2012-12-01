var com = com || {};
com.sppad = com.sppad || {};

com.sppad.Resizer = (function() {

    const RESIZE_PERIOD = 100;
    const ITEM_WIDTH = 24;
    
    var _launchers;
    var _overflowDecorator;
    var _overflowToolbarButton;
    
    var _lastResizeTime;
    var _resizeEventId = null;

    var _doResize = function() {
        
        /*
         * If you don't do this, bad things will occur. The only time resize
         * should be getting called is when the menu is supposed to be closed
         * anyway.
         * 
         * The issue observed is when 'hideLauncherStrategy' is 'groupOpenTabs'
         * and a bookmark is opened from a submenu. The tab getting added to the
         * launcher causes this function to be called.
         * 
         * However, it seems that modifying the menu or submenus while open
         * causes it to not open again correctly when pressed again.
         * Specifically, the onpopuphiding function never gets called, so it
         * seems the menu does not close correctly. If you resize the window for
         * a bit it might end up calling the onpopuphiding, etc. and open as
         * expected.
         * 
         * It might make more sense to check if _overflowToolbarButton is open,
         * then set a timeout to check again when it is closed. However,
         * checking open returns false here. Not sure why setting open to false
         * would have any effect in that case, but it seems to work.
         */
        _overflowToolbarButton.open = false;
        
        let windowSize = window.innerWidth;
        
        let overflowIcons = com.sppad.CurrentPrefs['overflowMode'] === 'maxIcons';
        let hideLaunchersWithoutTabs = com.sppad.CurrentPrefs['hideLauncherStrategy'] === 'noOpenTabs';
        let groupOpenTabs = com.sppad.CurrentPrefs['hideLauncherStrategy'] === 'groupOpenTabs';
        
        let maxWidth = windowSize * (com.sppad.CurrentPrefs['maxWidth'] / 100);
        let maxIcons = com.sppad.CurrentPrefs['maxIcons'];
        
        _launchers.maxWidth = overflowIcons == true ? windowSize : maxWidth;
        
        let boxEnd = _launchers.getBoundingClientRect().left + maxWidth;
        let children = _launchers.children;
        
        let overflowCount = 0;
        let remainingOpenLaunchers = 0;
        let remainingSlots = maxIcons;
        
        // Get the total number of open launchers
        for (let i=0; i < children.length; i++) {
            if(children[i].getAttribute('hasSingle') == 'true') {
                remainingOpenLaunchers++;
            }
        }
        
        // For each node, need to evaluate if it overflows or not
        for (let i=0; i < children.length; i++) {
            let overflow = false;
            let child = children[i];
            let isOpen = child.getAttribute('hasSingle') == 'true';
            
            // Always hide closed launchers when hideLaunchersWithoutTabs
            if(hideLaunchersWithoutTabs && !isOpen) {
                overflow = true;
            // Overflow when out of slots. Also when encountering a closed
            // launcher that
            // would take the slot of an open one when groupOpenTabs is set.
            } else if(overflowIcons) {
                overflow = remainingSlots <= 0;
                overflow |= groupOpenTabs && !isOpen && (remainingOpenLaunchers >= remainingSlots);
            // Just overflow based on the right edge. Note: don't use
            // child.getBoundingClientRect().right as the nodes may be
            // collapsed, causing right to be the same as left.
            } else {
                let childEnd = child.getBoundingClientRect().left + ITEM_WIDTH;
                overflow = childEnd > boxEnd;
            }
            
            if(isOpen) {
                remainingOpenLaunchers--;
            }
     
            if(overflow) {
                overflowCount++;
            } else {
                remainingSlots--; 
            }
            
            child.js.setOverflow(overflow == true);
        }
            
        _overflowToolbarButton.setAttribute('overflow', (overflowCount > 0) == true);
        _updateAttributes();
        _lastResizeTime = Date.now();
    };
    
    var _updateAttributes = function() {
        let selected = false;
        let unread = false;
        let titlechanged = false;
        
        let children = _launchers.children;
        for (let i=0; i < children.length; i++) {
            let child = children[i];
            
            if(child.getAttribute('overflow') != 'true')
                continue;
            
            unread |= child.getAttribute('unread') == 'true';
            selected |= child.getAttribute('selected') == 'true';
            titlechanged |= child.getAttribute('titlechanged') == 'true';
        }
        
        _overflowDecorator.setAttribute('unread', unread == true);
        _overflowDecorator.setAttribute('selected', selected == true);
        _overflowDecorator.setAttribute('titlechanged', titlechanged == true);
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
        
        onTabClose : function(aTab) {
            _updateAttributes();
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
