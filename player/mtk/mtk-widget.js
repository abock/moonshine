//
// This file is licensed under the MIT X11 open source license.
// http://www.opensource.org/licenses/mit-license.php
//
// Authors: Aaron Bockover <abockover@novell.com>
//
// Copyright 2009 Novell, Inc.
// 

function MtkWidget (settings) {
    MtkObject.call (this);

    //
    // Properties
    //

    this.ScreenGeneration = MtkScreenBinder.CurrentGeneration;
    this.__defineGetter__ ("Screen", function () MtkScreenBinder.GetScreenForGeneration (this.ScreenGeneration));
    
    this.Xaml = null;
    this.Settings = {};
    this.InitSettings = settings;
    this.Parent = null;
    this.IsRealized = false;
    this.IsMtkWidget = true;

    // 
    // XAML Utilities
    //

    this.Animate = function (animations, to_value) {
        if (animations instanceof Array) {
            for (var i = 0, n = animations.length; i < n && animations[i]; i++) {
                animations[i].To = to_value;
            }
        }
    };

    this.InitFromXaml = function (xaml) this.Xaml = this.Screen.Content.createFromXaml (xaml);
    this.CreateXaml = function (xaml) this.Screen.Content.createFromXaml (xaml);
    this.XamlFind = function (name) this.Xaml.FindName (this.Name + name);

    this.ForeachXamlChild = function (element, includeParent, func) {
        var elem = typeof element == "string" ? this.XamlFind (element) : (element || this.Xaml);
        if (elem == null) {
            return;
        }
        
        if (includeParent) {
            func.call (this, elem, -1);
        }

        var children = elem.Children;
        if (!children) {
            return;
        }

        for (var i = 0, n = children.Count; i < n; i++) {
            var child = children.GetItem (i);
            if (child != null) {
                func.call (this, child, i);
            }
        }
    };

    //
    // XAML Property Mapping
    //

    this.MapProperties = function (properties) {
        properties.forEach (function (property) {
            var name = property;
            var calls = [];
            if (property instanceof Array) {
                name = property.shift ();
                calls = property;
            }
            this.__defineGetter__ (name, function () this.Xaml[name]);
            this.__defineSetter__ (name, function (value) {
                this.Xaml[name] = value;
                if (calls instanceof Array) {
                    calls.forEach (function (call) this[call] (), this);
                }
            });
        }, this);
    };

    this.MapProperties ([ 
        [ "Height", "QueueResize" ], 
        [ "Width", "QueueResize" ],
        [ "Visibility", "QueueResize" ],
        "Opacity"
    ]);

    //
    // Widget Sizing/Allocation
    //
    
    this.Virtual ("OnStyleSet", function () { });

    this.Virtual ("OnRealize", function () {
        if (this.IsRealized) {
            return;
        }
        
        this.IsRealized = true;
        
        if (MtkStyle && MtkStyle.Notify) {
            MtkStyle.Notify.AddEventListener ("reload", delegate (this, this.OnStyleSet));
        }
        
        this.OnStyleSet ();
    });

    this.Realize = function () {
        if (!this.IsRealized) {
            this.OnRealize ();
        }
    };

    this.QueueResize = function () {
        var parent = this.TopLevel;
        if (parent) {
            parent.OnSizeAllocate ();
        }
    };
    
    this.__defineGetter__ ("TopLevel", function () {
        var parent = this.Parent || this;
        while (parent && parent.Parent) {
            parent = parent.Parent;
        }
        return parent;
    });

    this.Virtual ("OnSizeAllocate", function () {
        if (this.Xaml && this.IsRealized) {
            this.Xaml.Width = this.Allocation.Width;
            this.Xaml.Height = this.Allocation.Height;
            this.Xaml["Canvas.Left"] = this.Allocation.Left;
            this.Xaml["Canvas.Top"] = this.Allocation.Top;
        }
    });

    this.Virtual ("OnSizeRequest", function () {
        var self = this;
        return { Width: self.ActualWidth, Height: self.ActualHeight };
    });

    this._allocation = { Width: 0, Height: 0, Left: 0, Top: 0 };
    this.Virtual ("OnSizeAllocationRequest", function () this._allocation);

    this.__defineGetter__ ("SizeRequest", function () this.OnSizeRequest ());
    this.__defineGetter__ ("Allocation", function () this.OnSizeAllocationRequest ());
    this.__defineGetter__ ("ActualWidth", function () Math.round (this.Xaml.ActualWidth || this.Xaml.Width));
    this.__defineGetter__ ("ActualHeight", function () Math.round (this.Xaml.ActualHeight || this.Xaml.Height));
    
    this.__defineGetter__ ("Visible", function () this.Xaml.Visibility == "Visible");
    this.__defineSetter__ ("Visible", function (x) x ? this.Show () : this.Hide ());
    
    this.Virtual ("Show", function () {
        if (this.Visible) {
            return;
        }
        
        this.Xaml.Visibility = "Visible";
        this.QueueResize ();
    });
    
    this.Virtual ("Hide", function () {
        if (!this.Visible) {
            return;
        }
        
        this.Xaml.Visibility = "Collapsed";
        this.QueueResize ();
    });
   
    //
    // Post Object Construction Invocation/Property Setting
    //

    this.AfterConstructed = function () {
        // Only execute this function if the most derived object calls it
        if (this.constructor != arguments.callee.caller) {
            return;
        }

        if (this.InitSettings instanceof Function) {
            this.InitSettings.call (this);
        } else if (this.InitSettings instanceof Object) {
            for (var setting in this.InitSettings) {
                switch (setting) {
                    case "Events":
                        for (var name in this.InitSettings.Events) {
                            this.AddEventListener (name, this.InitSettings.Events[name]);
                        }
                        break;
                    case "With":
                        if (this.InitSettings.With instanceof Function) {
                            this.InitSettings.With.call (this);
                        }
                        break;
                    default:
                        this[setting] = this.InitSettings[setting];
                        break;
                }
            }
        }

        delete this["AfterConstructed"];
    }
};

var MtkWidgetUtils = {
    IsWidget: function (o) o && o instanceof Object && o.IsMtkWidget
};

