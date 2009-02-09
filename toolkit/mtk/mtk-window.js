function MtkWindow (settings) {
    MtkContainer.call (this, settings);

    MtkStyle.Reload ();

    this.Xaml = this.Screen.Xaml;
    this.Realize ();

    this.Override ("OnSizeAllocationRequest", function () {
        var self = this;
        return { 
            Width: self.Screen.Width, 
            Height: self.Screen.Height,
            Top: 0,
            Left: 0
        };
    });

    this.MapProperties (["Background"]);

    this.Screen.AddEventListener ("ScreenSizeChanged", delegate (this, function () this.QueueResize ()));
    this.Screen.AddEventListener ("FullScreenChanged", delegate (this, function () this.QueueResize ()));
    
    this.AfterConstructed ();
}

