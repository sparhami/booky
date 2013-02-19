if (typeof com == "undefined") {
    var com = {};
}

com.sppad = com.sppad || {};
com.sppad.booky = com.sppad.booky || {};

com.sppad.booky.LauncherAssignmentDialog = new function() {
    var self = this;

    this.open = function(aWindow, aCallback) {

        self.window = aWindow;
        self.callback = aCallback;

        let background = aWindow.document.getElementById('launcherPickerBackground');
        let picker = aWindow.document.getElementById('launcherPicker');
        let launchers = com.sppad.booky.Launcher.getLaunchers();
        
        background.setAttribute('hidden', false);
        picker.focus();
        
        self.window.addEventListener('keydown', self.keyup, false);
        
         while(picker.firstChild)
             picker.removeChild(picker.firstChild);
                
         for(let i=0; i<launchers.length; i++) {
             let launcher = launchers[i];
                        
             let item = document.createElement('button');
             item.launcher = launcher;
             item.setAttribute('class', 'plain');
             item.setAttribute('type', 'radio');
             item.setAttribute('tooltiptext', launcher.label);
             item.setAttribute('image', launcher.image);
             item.addEventListener('command', function() { self.pick(launcher); } );
                        
             picker.appendChild(item);
         }
    };

    this.close = function() {
        let background = self.window.document.getElementById('launcherPickerBackground');
        background.setAttribute('hidden', true);

        self.window.removeEventListener('keydown', self.keyup);
    };

    this.pick = function(aLauncher) {
        self.callback.call(undefined, aLauncher);
        self.close();
    };

    this.keyup = function(aEvent) {
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
        aEvent.stopPropagation();
    };
}