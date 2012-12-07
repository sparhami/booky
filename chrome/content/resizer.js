if (typeof com == "undefined") {
  var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

com.sppad.booky.Resizer = new function() {

    /*
     * Minimum amount of time, in milliseconds, between subsequent calls to
     * _doResize
     */
    const RESIZE_PERIOD = 100;
    
    /*
     * Width of an item in pixels. Hard coded for now. Needed to determine where
     * the right edge of a collapsed icon would be, were it not collapsed.
     */
    const ITEM_WIDTH = 24;
    
    let self = this;
    
    self._launchers;
    self._overflowDecorator;
    self._overflowToolbarButton;
    
    // Used to prevent resizing too often
    self._lastResizeTime;
    // Tracks timeout event for resize
    self._resizeEventId = null;

    self._doResize = function() {
        
        let windowSize = window.innerWidth;
        
        let overflowByIcons = com.sppad.booky.CurrentPrefs['overflowMode'] === 'maxIcons';
        let hideLaunchersWithoutTabs = com.sppad.booky.CurrentPrefs['hideLauncherStrategy'] === 'noOpenTabs';
        let groupOpenTabs = com.sppad.booky.CurrentPrefs['hideLauncherStrategy'] === 'groupOpenTabs';
        
        let maxWidth = windowSize * (com.sppad.booky.CurrentPrefs['maxWidth'] / 100);
        let maxIcons = com.sppad.booky.CurrentPrefs['maxIcons'];
        
        // If overflowing by icons, then maxWidth should be the window size
        self._launchers.maxWidth = overflowByIcons == true ? windowSize : maxWidth;
        
        // Setting size lets us find the ending pixel of the space we have
        let boxEnd = self._launchers.getBoundingClientRect().left + maxWidth;
        
        let children = self._launchers.children;
        let overflowCount = 0;
        let remainingOpenLaunchers = 0;
        let remainingSlots = maxIcons;
        
        // Get the number of open launchers. Also set the ordinal when
        // appropriate.
        for (let i=0; i < children.length; i++) {
            let ordinalOffset = 65536;
            let child = children[i];
            let open = child.getAttribute('hasSingle') == 'true';
            
            if(open) {
                remainingOpenLaunchers++;
            }
            
            /*
             * Need to set offset from Javascript because sharing the same
             * ordinal using CSS does not leave the items in the right order. Do
             * this before doing overflow checks because it may be done doing
             * width, so they need to be in the right order.
             */
            if((hideLaunchersWithoutTabs || groupOpenTabs) && open) {
                ordinalOffset = 0;
            }

            // Don't set ordinal for the menu node since it is buggy.
            child.js.setOrdinal(i + ordinalOffset);
        }
        
        // For each node, need to evaluate if it overflows or not
        for (let i=0; i < children.length; i++) {
            let overflow = false;
            let child = children[i];
            let open = child.getAttribute('hasSingle') == 'true';
            
            // Always hide closed launchers when hideLaunchersWithoutTabs
            if(hideLaunchersWithoutTabs && !open) {
                overflow = true;
            } 
            /*
             * Overflow when out of slots. Also when encountering a closed
             * launcher that would take the slot of an open one when
             * groupOpenTabs is set.
             */
            else if(overflowByIcons) {
                overflow = remainingSlots <= 0;
                overflow |= groupOpenTabs && !open && (remainingOpenLaunchers >= remainingSlots);
            }
            /*
             * Just overflow based on the right edge. Note: don't use
             * child.getBoundingClientRect().right as the nodes may be
             * collapsed, causing right to be the same as left.
             */
            else {
                let childEnd = child.getBoundingClientRect().left + ITEM_WIDTH;
                overflow = childEnd > boxEnd;
            }
            
            if(open) {
                remainingOpenLaunchers--;
            }
     
            if(overflow) {
                overflowCount++;
            } else {
                remainingSlots--; 
            }
            
            child.js.setAttribute('overflow', overflow == true);
        }
            
        self._overflowToolbarButton.setAttribute('overflow', (overflowCount > 0) == true);
        self._updateAttributes();
        self._lastResizeTime = Date.now();
    };
    
    /*
     * Updates the attributes for the overflow decorator, which styles the
     * overflow icon. Checks all overflowed nodes to see if they have a status
     * that the user needs to know about.
     */
    self._updateAttributes = function() {
        let selected = false;
        let unread = false;
        let titlechanged = false;
        
        let children = self._launchers.children;
        for (let i=0; i < children.length; i++) {
            let child = children[i];
            
            if(child.getAttribute('overflow') != 'true')
                continue;
            
            unread |= child.getAttribute('unread') == 'true';
            selected |= child.getAttribute('selected') == 'true';
            titlechanged |= child.getAttribute('titlechanged') == 'true';
        }
        
        self._overflowDecorator.setAttribute('unread', unread == true);
        self._overflowDecorator.setAttribute('selected', selected == true);
        self._overflowDecorator.setAttribute('titlechanged', titlechanged == true);
    };

    return {

        /*
         * Handles any situation where the items displayed for the launchers may
         * change, such as the screen resizing or a new bookmark being added,
         */
        onResize : function() {
            window.clearTimeout(self._resizeEventId);

            // Resize at most once every 100 ms
            let timeSinceResize = Date.now() - self._lastResizeTime;
            if (timeSinceResize > RESIZE_PERIOD)
                self._doResize();
            else
                self._resizeEventId = window.setTimeout( function() { self._doResize(); }, RESIZE_PERIOD - timeSinceResize);
        },
        
        onTabClose : function(aTab) {
            self._updateAttributes();
        },
        
        onTabSelect : function(aTab) {
            self._updateAttributes();
        },
        
        onTabTitleChange : function(aTab) {
            self._updateAttributes();
        },
        
        onTabTitleChangeCleared : function(aTab) {
            self._updateAttributes();
        },
        
        setup : function() {
            
            self._launchers = window.document.getElementById('com_sppad_booky_launchers');
            self._overflowDecorator = window.document.getElementById('com_sppad_booky_launchers_overflow_decorator');
            self._overflowToolbarButton = window.document.getElementById('com_sppad_booky_launchers_overflow_button');
            window.addEventListener('resize', this.onResize, false);

            self._doResize();
        },

    }
};