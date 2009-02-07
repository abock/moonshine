function MtkWindow (settings) {
    MtkContainer.call (this, settings);

    this.Xaml = this.Control.Content.Root;
    this.IsRealized = true;

    this.Override ("OnSizeAllocationRequest", function () {
        var self = this;
        return { 
            Width: self.Control.Content.ActualWidth, 
            Height: self.Control.Content.ActualHeight,
            Top: 0,
            Left: 0
        };
    });
    
    this.Control.Content.OnResize = delegate (this, this.OnSizeAllocate);

    this.AfterConstructed ();
}

