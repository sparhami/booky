if (typeof com == "undefined") {
    var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

/**
 * Handles the dialog for picking a launcher to assign to. A callback is
 * registered and fired when an item is picked. If the dialog is cancelled, the
 * callback is not called.
 * 
 * @param aWindow
 *            The window containing the dialog
 * @param aLauncher
 *            A launcher to not display
 * @param aCallback
 *            A function with one argument, a Launcher
 */
com.sppad.booky.LauncherAssignmentDialog = function(aWindow, aLauncher, aCallback) {
   
    let self = this;

    self.window = aWindow;
    self.callback = aCallback;
    self.launcher = aLauncher;
    self.newButton = aWindow.document.getElementById('launcherPicker_new');
    self.closeButton = aWindow.document.getElementById('launcherPicker_cancel');
    
    self.selectedItem = null;
    
    /**
     * Initializes the dialog, loading buttons for each Launcher, registering
     * listeners and showing the dialog.
     */
    this.setup = function() {
        let background = aWindow.document.getElementById('launcherPickerBackground');
        let picker = aWindow.document.getElementById('launcherPicker');
        let launchers = com.sppad.booky.Launcher.getLaunchers();
        
        background.setAttribute('hidden', false);
        
        while(picker.firstChild)
            picker.removeChild(picker.firstChild);
                
        // Add an item for each launcher (other than self.launcher)
        for(let i=0; i<launchers.length; i++) {
            let launcher = launchers[i];
                        
            if(launcher === self.launcher)
                continue;
            
            let item = document.createElement('button');
            item.launcher = launcher;
            item.setAttribute('class', 'plain');
            item.setAttribute('tooltiptext', launcher.label);
            item.setAttribute('image', launcher.image);
            item.addEventListener('command', function() { self.pick(launcher); } );
                        
            picker.appendChild(item);
        }
        
        if(launchers.length <= 1) {
            // nothing to pick from
            picker.setAttribute('collapsed', 'true');
        } else {
            // set default selected item to center item
            let childNodes = picker.childNodes;
            let centerIndex = Math.floor(childNodes.length / 2);
            self.select(childNodes[centerIndex]);
        }
        
        self.newButton.addEventListener('command', self.newLauncher, false);
        self.closeButton.addEventListener('command', self.close, false);
        self.window.addEventListener('keypress', self.keypress, false);        
    };

    /**
     * Closes the dialog, unregistering listeners and hiding the dialog.
     */
    this.close = function() {
        let background = self.window.document.getElementById('launcherPickerBackground');
        background.setAttribute('hidden', true);
        
        self.newButton.removeEventListener('command', self.newLauncher);
        self.closeButton.removeEventListener('command', self.close);
        self.window.removeEventListener('keypress', self.keypress);
    };

    /**
     * Selects a Launcher, calling the callback and closing the dialog.
     * 
     * @param aLauncher
     *            The launcher that has been selected.
     */
    this.pick = function(aLauncher) {
        self.callback.call(undefined, aLauncher);
        self.close();
    };
    
    /**
     * Selects a new launcher as the launcher, creating it and choosing it as
     * the selected launcher.
     */
    this.newLauncher = function() {
        let newItemId = com.sppad.booky.Bookmarks.createFolder();
        let newLauncher = com.sppad.booky.Launcher.getLauncher(newItemId);
        
        self.pick(newLauncher);
    };
    
    /**
     * Sets an item as selected, applying the selected style. If the user hits
     * return, the selected item is picked.
     */
    this.select = function(aItem) {
        if(!aItem)
            return;
            
        if(self.selectedItem)
            self.selectedItem.removeAttribute('selected');
        
        self.selectedItem = aItem;
        self.selectedItem.setAttribute('selected', 'true');
        
        let picker = aWindow.document.getElementById('launcherPicker');
        picker.ensureElementIsVisible(self.selectedItem);
    };

    this.keypress = function(aEvent) {
        switch (aEvent.keyCode) {
            case KeyEvent.DOM_VK_RETURN:
                if(self.selectedItem)
                    self.pick(self.selectedItem.launcher);
                break;
            case KeyEvent.DOM_VK_ESCAPE:
                self.close();
                break;
            case KeyEvent.DOM_VK_RIGHT:
                if(self.selectedItem)
                    self.select(self.selectedItem.nextSibling);
                break;
            case KeyEvent.DOM_VK_LEFT:
                if(self.selectedItem)
                    self.select(self.selectedItem.previousSibling);
                break;
            default:
                break;
        }
        
        aEvent.preventDefault();
    };
    
    this.setup();
}