function MtkPopup (settings) {
    MtkContainer.call (this, settings);
    
    this.InitFromXaml ('<Canvas></Canvas>');
    
    this.centered_offset_x = 0;
    this.centered_offset_y = 0;
    
    this.__defineGetter__ ("CenteredOffsetX", function () this.centered_offset_x);
    this.__defineSetter__ ("CenteredOffsetX", function (x) {
        this.centered_offset_x = x;
        if (this.keep_centered) {
            this.PositionCenter ();
        }
    });
    
    this.__defineGetter__ ("CenteredOffsetY", function () this.centered_offset_y);
    this.__defineSetter__ ("CenteredOffsetY", function (y) {
        this.centered_offset_y = y;
        if (this.keep_centered) {
            this.PositionCenter ();
        }
    });
   
    this.is_mapped = false;
    this.keep_centered = false;
    
    this.Screen.AddEventListener ("ScreenSizeChanged", delegate (this, function () {
        this.QueueResize ();
        if (this.keep_centered) {
            this.PositionCenter ();
        }
    }));
    
    this.Override ("Show", function () {
        this.VisibilityStoryboard.Stop ();
        this.Xaml.Opacity = 1;
    
        if (this.is_mapped) {
            return;
        }
        
        if (!this.IsRealized) {
            this.Realize ();
        }
        
        this.is_mapped = true;
        this.Screen.Xaml.Children.Add (this.Xaml);
        this.OnSizeAllocate ();
        this.$Show$ ();
    });
    
    this.Override ("Hide", function () {
        if (!this.is_mapped || !this.IsRealized) {
            return;
        }
        
        this.VisibilityStoryboard.Stop ();
        this.Xaml.Opacity = 1;
        
        this.is_mapped = false;
        this.Screen.Xaml.Children.Remove (this.Xaml);
        this.$Hide$ ();
    });
    
    this.Override ("OnStyleSet", function () {
        this.background_fill = MtkStyle.CreateLinearGradient (this,
            [0, 1], ["#7000", "#b000"]
        );
        
        this.background_stroke = "#e000";
    });
    
    this.HeightRequest = 0;
    this.WidthRequest = 0;
    
    this.Override ("OnSizeRequest", function () {
        var sr = this.$OnSizeRequest$ ();
        sr.Width = Math.max (sr.Width, this.WidthRequest);
        sr.Height = Math.max (sr.Height, this.HeightRequest);
        return sr;
    });
    
    this.Override ("OnSizeAllocate", function () {
        if (!this.IsRealized) {
            return;
        }
        
        var sr = this.SizeRequest;
        
        this.Xaml.Width = this.Allocation.Width = sr.Width;
        this.Xaml.Height = this.Allocation.Height = sr.Height;
        
        this.SizeAllocateChildren ();
        
        
        /*this.ForeachXamlChild (null, true, function (elem, index) {
            if (index > 0) {
                return;
            }
            
            MtkConsole.Log (elem.toString () + ", " + index);
            
            elem.Width = this.Allocation.Width;
            elem.Height = this.Allocation.Height;
            if (index < 0) {
                elem["Canvas.Left"] = this.Allocation.Left;
                elem["Canvas.Top"] = this.Allocation.Top;
            } else {
                elem.Fill = this.background_fill;
                elem.Stroke = this.background_stroke;
                elem.StrokeThickness = 2;
            }
        });*/
    });
    
    this.Virtual ("Position", function (x, y) {
        this.keep_centered = false;    
        if (x >= 0) this.Xaml["Canvas.Left"] = this.Allocation.Left = x;
        if (y >= 0) this.Xaml["Canvas.Top"] = this.Allocation.Top = y;
    });
    
    this.Virtual ("PositionCenter", function () {
        MtkConsole.ObjDump (this.Screen.Width);
    
        this.keep_centered = true;
        this.Xaml["Canvas.Left"] = this.Allocation.Left = 
            Math.round ((this.Screen.Width - this.Allocation.Width - this.CenteredOffsetX) / 2);
        this.Xaml["Canvas.Top"] = this.Allocation.Top = 
            Math.round ((this.Screen.Height - this.Allocation.Height - this.CenteredOffsetY) / 2);
            
        MtkConsole.ObjDump (this.Allocation);
    });
    
    //
    // Fade In/Out
    //
        
    this.Xaml.Name = this.Name;
    this.VisibilityStoryboard = this.CreateXaml ('<Storyboard Storyboard.TargetProperty="(Opacity)"/>');
    this.VisibilityAnimation = this.CreateXaml ('<DoubleAnimation Duration="0:0:0.4"/>');
    this.VisibilityAnimation["Storyboard.TargetName"] = this.Name;
    this.Xaml.Resources.Add (this.VisibilityStoryboard);
    this.VisibilityStoryboard.Children.Add (this.VisibilityAnimation);
    this.VisibilityStoryboard.AddEventListener ("completed", delegate (this, function () {

    }));
    
    this.FadeOut = function () {
        this.VisibilityAnimation.To = 0;
        this.VisibilityStoryboard.Begin ();
    };
    
    this.FadeIn = function () {
        this.VisibilityAnimation.To = 1;
        this.VisibilityStoryboard.Begin ();
    };
    
    this.AfterConstructed ();
}