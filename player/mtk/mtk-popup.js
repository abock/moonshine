//
// This file is licensed under the MIT X11 open source license.
// http://www.opensource.org/licenses/mit-license.php
//
// Authors: Aaron Bockover <abockover@novell.com>
//
// Copyright 2009 Novell, Inc.
// 

function MtkPopup (settings) {
    MtkContainer.call (this, settings);
    this.InitFromXaml ('<Canvas/>');
    
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
    
    this.Screen.AddEventListener ("ScreenSizeChanged", delegate (this, this.OnSizeAllocate));
    this.Screen.AddEventListener ("FullScreenChanged", delegate (this, this.OnSizeAllocate));
    
    this.Map = function () {
        if (this.is_mapped) {
            return false;;
        }
            
        if (!this.IsRealized) {
            this.Realize ();
        }
        
        this.is_mapped = true;
        this.Screen.Xaml.Children.Add (this.Xaml);
        this.OnSizeAllocate ();
        return true;
    };
    
    this.Override ("Show", function () {
        this.VisibilityStoryboard.Stop ();
        this.Xaml.Opacity = 1;

        this.Map ();
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
        
        if (this.keep_centered) {
            this.Xaml["Canvas.Left"] = this.Allocation.Left = 
                Math.round ((this.Screen.Width - this.Allocation.Width - this.CenteredOffsetX) / 2);
            this.Xaml["Canvas.Top"] = this.Allocation.Top = 
                Math.round ((this.Screen.Height - this.Allocation.Height - this.CenteredOffsetY) / 2);
        }
    });
    
    this.Virtual ("Position", function (x, y) {
        this.keep_centered = false;    
        if (x >= 0) this.Xaml["Canvas.Left"] = this.Allocation.Left = x;
        if (y >= 0) this.Xaml["Canvas.Top"] = this.Allocation.Top = y;
    });
    
    this.Virtual ("PositionCenter", function () {
        this.keep_centered = true;
        this.OnSizeAllocate ();
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
        if (this.Map ()) {
            this.Xaml.Opacity = 0;
        }
        
        this.VisibilityAnimation.To = 1;
        this.VisibilityStoryboard.Begin ();
    };
    
    this.toggle_in = true;
    this.ToggleFade = function () {
        if (this.toggle_in) {
            this.FadeIn ();
            this.toggle_in = false;
        } else {
            this.FadeOut ();
            this.toggle_in = true;
        }
    };
    
    this.AfterConstructed ();
}
