//
// This file is licensed under the MIT X11 open source license.
// http://www.opensource.org/licenses/mit-license.php
//
// Authors: Aaron Bockover <abockover@novell.com>
//
// Copyright 2009 Novell, Inc.
// 

function MtkContainer (settings) {
    MtkWidget.call (this, settings);

    //
    // Properties
    //

    this.Children = [];
    
    this.InnerPadding = 0;
    this.x_pad = 0;
    this.y_pad = 0;
    
    this.__defineGetter__ ("XPad", function () this.x_pad);
    this.__defineSetter__ ("XPad", function (p) {
        this.x_pad = p;
        this.QueueResize ();
    });
    
    this.__defineGetter__ ("YPad", function () this.y_pad);
    this.__defineSetter__ ("YPad", function (p) {
        this.y_pad = p;
        this.QueueResize ();
    });
    
    this.__defineSetter__ ("Padding", function (p) {
        this.y_pad = p;
        this.x_pad = p;
        this.QueueResize ();
    });

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
            if (!child.Visible) {
                return;
            }
            var sr = child.SizeRequest;
            request.Width = Math.max (sr.Width, request.Width);
            request.Height = Math.max (sr.Height, request.Height);
        }, this);
        request.Width += 2 * this.TotalXPadding;
        request.Height += 2 * this.TotalYPadding;
        return request;
    });
    
    this.Override ("OnSizeAllocate", function () {
        if (!this.IsRealized) {
            return;
        }
        
        this.$OnSizeAllocate$ ();
        this.SizeAllocateChildren ();
    });
    
    this.Virtual ("SizeAllocateChildren", function () {
        this.Children.forEach (function (child) {
            if (!child.Visible) {
                return;
            }
            
            child.Allocation.Left = this.TotalYPadding;
            child.Allocation.Top = this.TotalXPadding;
            child.Allocation.Width = this.Allocation.Width - 2 * this.TotalXPadding;
            child.Allocation.Height = this.Allocation.Height - 2 * this.TotalYPadding;
            child.Realize ();
            child.OnSizeAllocate ();
        }, this);
    });

    this.__defineGetter__ ("TotalXPadding", function () this.XPad + this.InnerPadding);
    this.__defineGetter__ ("TotalYPadding", function () this.YPad + this.InnerPadding);

    this.AfterConstructed ();
}

