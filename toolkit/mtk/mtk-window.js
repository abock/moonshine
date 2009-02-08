function MtkWindow (settings) {
    MtkContainer.call (this, settings);

    MtkStyle.Reload ();

    this.Xaml = this.Control.Content.Root;
    this.Realize ();

    this.Override ("OnSizeAllocationRequest", function () {
        var self = this;
        return { 
            Width: self.Control.Content.ActualWidth, 
            Height: self.Control.Content.ActualHeight,
            Top: 0,
            Left: 0
        };
    }); 

    this.Virtual ("OnFullScreenChange", function () this.QueueResize);

    this.Virtual ("OnToggleFullScreen", function () {
        this.Control.Content.FullScreen = !this.Control.Content.FullScreen;
        this.QueueResize ();
    });

    this.ToggleFullScreen = function () this.OnToggleFullScreen ();

    this.Control.Content.OnResize = delegate (this, this.QueueResize);
    this.Control.Content.OnFullScreenChange = delegate (this, this.OnFullScreenChange);
    this.MapProperties (["Background"]);

    this.AfterConstructed ();
}

