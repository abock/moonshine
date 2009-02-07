function MtkWidget (settings) {
    MtkObject.call (this);

    var xaml_host = settings instanceof Object ? settings.XamlHost : null;

    //
    // Properties
    //

    this.Control = xaml_host || MtkContext.XamlHost;
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

    this.InitFromXaml = function (xaml) this.Xaml = this.Control.Content.createFromXaml (xaml);
    this.CreateXaml = function (xaml) this.Control.Content.createFromXaml (xaml);

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
        [ "RenderTransform", "QueueResize" ]
        [ "RenderTransformOrigin", "QueueResize" ],
        [ "Visibility", "QueueResize" ],
        "IsHitTestVisible", 
        "Opacity", 
        "OpacityMask", 
        "Resources", 
        "Tag", 
        "Triggers"
    ]);

    //
    // Widget Sizing/Allocation
    //

    this.QueueResize = function () {
        var parent = this.Parent;
        while (parent && parent.Parent) {
            parent = parent.Parent;
        }
        if (parent) {
            parent.OnSizeAllocate ();
        }
    };

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

