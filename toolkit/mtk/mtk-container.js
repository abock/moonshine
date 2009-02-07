function MtkContainer (settings) {
    MtkWidget.call (this, settings);

    //
    // Properties
    //

    this.Children = [];
    this.Padding = 0;
    this.InnerPadding = 0;

    //
    // Collection Logic
    //

    this.Add = function (widget, before) {
        if (this.Xaml && widget && widget.Xaml && this.Children.indexOf (widget) < 0) {
            this.Xaml.Children.Add (widget.Xaml);
            this.Children.push (widget);
            widget.Parent = this;
            this.OnSizeAllocate ();
        }
    };

    this.Remove = function (widget) {
        var index = this.Children.indexOf (widget);
        if (index >= 0) {
            this.Children.splice (index, 1);
            widget.Parent = null;
        }

        if (this.Xaml && widget && widget.Xaml) {
            this.Xaml.Children.Remove (widget.Xaml);
            this.OnSizeAllocate ();
        }
    };

    this.__defineGetter__ ("ChildCount", function () this.Children.length);

    //
    // Sizing and Allocation
    //

    this.Override ("OnSizeRequest", function () {
        var request = { Width: 0, Height: 0 };
        this.Children.forEach (function (child) {
            var sr = child.SizeRequest;
            request.Width = Math.max (sr.Width, request.Width);
            request.Height = Math.max (sr.Height, request.Height);
        }, this);
        request.Width += 2 * this.TotalPadding;
        request.Height += 2 * this.TotalPadding;
        return request;
    });
    
    this.Override ("OnSizeAllocate", function () {
        if (!this.IsRealized) {
            return;
        }
        
        this.$OnSizeAllocate$ ();
        
        this.Children.forEach (function (child) {
            child.Allocation.Left = this.TotalPadding;
            child.Allocation.Top = this.TotalPadding;
            child.Allocation.Width = this.Allocation.Width - 2 * this.TotalPadding;
            child.Allocation.Height = this.Allocation.Height - 2 * this.TotalPadding;
            child.Realize ();
            child.OnSizeAllocate ();
        }, this);
    });

    this.__defineGetter__ ("TotalPadding", function () this.Padding + this.InnerPadding);

    this.AfterConstructed ();
}

