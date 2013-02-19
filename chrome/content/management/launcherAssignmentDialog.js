if (typeof com == "undefined") {
    var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

com.sppad.booky.LauncherAssignmentDialog = function(aWindow, aLauncher, aCallback) {
   
    let self = this;

    self.window = aWindow;
    self.callback = aCallback;
    self.launcher = aLauncher;
    self.newButton = aWindow.document.getElementById('launcherPicker_new');
    self.closeButton = aWindow.document.getElementById('launcherPicker_cancel');
    
    this.setup = function() {
        let background = aWindow.document.getElementById('launcherPickerBackground');
        let picker = aWindow.document.getElementById('launcherPicker');
        let launchers = com.sppad.booky.Launcher.getLaunchers();
        
        background.setAttribute('hidden', false);
        
        while(picker.firstChild)
            picker.removeChild(picker.firstChild);
                
        for(let i=0; i<launchers.length; i++) {
            let launcher = launchers[i];
                        
            if(launcher === self.launcher)
                continue;
            
            let item = document.createElement('button');
            item.launcher = launcher;
            item.setAttribute('class', 'plain');
            item.setAttribute('type', 'radio');
            item.setAttribute('tooltiptext', launcher.label);
            item.setAttribute('image', launcher.image);
            item.addEventListener('command', function() { self.pick(launcher); } );
                        
            picker.appendChild(item);
        }
        
        self.newButton.addEventListener('command', self.newLauncher, false);
        self.closeButton.addEventListener('command', self.close, false);
        self.window.addEventListener('keypress', self.keypress, false);        
    };

    this.close = function() {
        let background = self.window.document.getElementById('launcherPickerBackground');
        background.setAttribute('hidden', true);
        
        self.newButton.removeEventListener('command', self.newLauncher);
        self.closeButton.removeEventListener('command', self.close);
        self.window.removeEventListener('keypress', self.keypress);
    };

    this.pick = function(aLauncher) {
        self.callback.call(undefined, aLauncher);
        self.close();
    };
    
    this.newLauncher = function() {
        let newItemId = com.sppad.booky.Bookmarks.createFolder();
        let newLauncher = com.sppad.booky.Launcher.getLauncher(newItemId);
        
        self.pick(newLauncher);
    };

    this.keypress = function(aEvent) {
        
        switch (aEvent.keyCode) {
            case KeyEvent.DOM_VK_RETURN:
                self.close();
                break;
            case KeyEvent.DOM_VK_ESCAPE:
                self.close();
                break;
            default:
                break;
        }
        
        aEvent.preventDefault();
    };
    
    this.setup();
}