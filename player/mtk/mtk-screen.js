function MtkScreen (control) {
    MtkObject.call (this);
    
    this.Control = control;
    
    this.Control.Content.OnFullScreenChange = delegate (this, function ()
        this.RaiseEvent ("FullScreenChanged"));
    
    this.Control.Content.OnResize = delegate (this, function ()
        this.RaiseEvent ("ScreenSizeChanged", this.Width, this.Height));
    
    this.__defineGetter__ ("Content", function () this.Control.Content);
    this.__defineGetter__ ("Xaml", function () this.Control.Content.Root);
    
    this.__defineGetter__ ("Width", function () this.Control.Content.ActualWidth);
    this.__defineGetter__ ("Height", function () this.Control.Content.ActualHeight);
    
    this.Virtual ("SetFullScreen", function (fs) this.Control.Content.FullScreen = fs);
    this.Virtual ("GetFullScreen", function () this.Control.Content.FullScreen);
    this.Virtual ("OnToggleFullScreen", function () {
        this.SetFullScreen (!this.GetFullScreen ());
        this.RaiseEvent ("ToggleFullScreen", this.GetFullScreen ());
    });

    this.ToggleFullScreen = function () this.OnToggleFullScreen ();
}

var MtkScreenBinder = {

    ConnectedScreens: [],
    get CurrentGeneration () { return this.ConnectedScreens.length },

    BindScreen: function (control) {
        this.ConnectedScreens.push (new MtkScreen (control.GetHost ()));
        return this.ConnectedScreens.length;
    },
    
    GetScreenForGeneration: function (generation) {
        return this.ConnectedScreens[generation - 1];
    }
};

