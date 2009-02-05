function delegate (target, callback) function () callback.apply (target, arguments);

function Bind (control) {
    MtkContext.SilverlightOnLoad (control);

    var win = new MtkWindow;
    var container = new MtkVBox;
    var controls = new MtkHBox;

    var label = new MtkLabel ({ Text: "Holy crap, a crappy toolkit" });

    container.PackStart (new MtkCanvas, true);


    controls.PackStart (new MtkCanvas);
    controls.PackStart (new MtkCanvas, true);
    controls.PackStart (new MtkCanvas);
    controls.PackStart (label);
    controls.PackStart (new MtkButton);
    controls.PackStart (new MtkCanvas, true);
    controls.PackStart (new MtkCanvas);
    container.PackStart (controls);

    container.PackStart (new MtkCanvas, true);

    win.AddChild (container);

    setInterval (delegate (this, function () {
        var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 ";
        var len = 5 + Math.floor (Math.random () * 50);
        var str = "";
        for (var i = 0; i < len; i++) {
            var idx = Math.floor (Math.random () * (chars.length - 1));
            str += chars[idx];
        }
        label.Text = str;
    }), 1000);

    var size = 5;
    label.FontSize = 5;
    setInterval (delegate (this, function () {
        label.FontSize = size++;
    }), 1500);       
}

var MtkContext = {
    
    XamlHost: null,

    SilverlightOnLoad: function (control) {
        this.XamlHost = control.GetHost ();
    }
};



function MtkWidget (settings) {

    var xaml_host = settings ? settings.XamlHost : null;

    // Properties
    this.Control = xaml_host || MtkContext.XamlHost;
    this.Xaml = null;
    this.Settings = {};
    this.Parent = null;

    this._events = {};

    this.Name = (this.constructor && this.constructor.name) 
        ? this.constructor.name.toString ()
        : "MtkWidget_Unknown";
    this.Name = this.Name + "_" + (MtkWidget.Instances++).toString ();

    this.AddEventListener = function (eventName, handler, before) {
        if (!(handler instanceof Function)) {
            throw new TypeError;
        }
        
        var name = eventName.toLowerCase ();
        var event = this._events[name];
        
        if (event instanceof Array) {
            if (before) {
                event.unshift (handler);
            } else {
                event.push (handler);
            }
        } else {
            event = [ handler ];
        }
        
        this._events[name] = event;
    };

    this.RemoveEventListener = function (eventName, handler) {
        if (!(handler instanceof Function)) {
            throw new TypeError;
        }

        var name = eventName.toLowerCase ();
        var event = this._events[name];

        if (event instanceof Array) {
            event = event.filter (function (e) e != handler);
            if (event.length > 0) {
                this._events[name] = event;
            } else {
                delete this._events[name];
            }
        }
    };

    this.RaiseEvent = function (eventName) {
        var name = eventName.toLowerCase ();
        var event = this._events[name];

        if (event instanceof Array) {
            var event_args = Array.prototype.slice.call (arguments);
            event_args[0] = this;
            event.forEach (function (handler) {
                if (handler instanceof Function) {
                    handler.apply (this, event_args);
                }
            }, this);
        }
    };

    this.Animate = function (animations, to_value) {
        for (var i = 0, n = animations.length; i < n; i++) {
            animations[i].To = to_value;
        }
    };

    this.CreateXaml = function (xaml) {
        this.Xaml = this.Control.Content.createFromXaml (xaml);
    };

    this.QueueResize = function () {
        var parent = this.Parent;
        while (parent && parent.Parent) {
            parent = parent.Parent;
        }
        if (parent) {
            parent.Layout ();
        }
    };

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
                MoonConsole.Log ("SET [" + name + "] = " + value.toString ());
                if (calls instanceof Array) {
                    calls.forEach (function (call) {
                        MoonConsole.Log ("  CALLING: " + this.constructor.name + "." + call);
                        this[call] ();
                    }, this);
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
        "IsHitTestVisible", "Opacity", "OpacityMask", 
        "Resources", "Tag", "Triggers"
    ]);

    this.Layout = function () { };

    this.__defineGetter__ ("SizeRequest", function () {
        var self = this;
        return { Width: self.Width, Height: self.Height };
    });
    
    var self = this;
    this.Allocation = { 
        get Width ()   { return self.Xaml ? self.Xaml.Width : 0 },
        set Width (x)  { if (self.Xaml) self.Xaml.Width = x; },
        get Height ()  { return self.Xaml ? self.Xaml.Height : 0 },
        set Height (x) { if (self.Xaml) self.Xaml.Height = x; },
        get Top ()  { return self.Xaml ? self.Xaml["Canvas.Top"] : 0 },
        set Top (x) { if (self.Xaml) self.Xaml["Canvas.Top"] = x; },
        get Left ()   { return self.Xaml ? self.Xaml["Canvas.Left"] : 0 },
        set Left (x)  { if (self.Xaml) self.Xaml["Canvas.Left"] = x; },
    };
};

MtkWidget.Instances = 0;



function MtkCanvas (settings) {
    MtkWidget.call (this, settings);
    this.CreateXaml ("<Canvas/>");
    var color = "sc#" +
        Math.random ().toString () + "," +
        Math.random ().toString () + "," +
        Math.random ().toString ();
    this.Xaml["Background"] = color;

    this.__defineGetter__ ("SizeRequest", function () { return { Width: 30, Height: 30 } });
}



function MtkContainer (settings) {
    MtkWidget.call (this, settings);

    // Properties
    this.Children = [];

    this.AddChild = function (widget, before) {
        if (this.Xaml && widget && widget.Xaml && this.Children.indexOf (widget) < 0) {
            this.Xaml.Children.Add (widget.Xaml);
            this.Children.push (widget);
            widget.Parent = this;
            this.Layout ();
        }
    };

    this.RemoveChild = function (widget) {
        var index = this.Children.indexOf (widget);
        if (index >= 0) {
            this.Children.splice (index, 1);
            widget.Parent = null;
        }

        if (this.Xaml && widget && widget.Xaml) {
            this.Xaml.Children.Remove (widget.Xaml);
            this.Layout ();
        }
    };

    this.Layout = function () {
        this.Children.forEach (function (child) {
            child.Allocation.Left = this.Allocation.Left;
            child.Allocation.Top = this.Allocation.Top;
            child.Allocation.Width = this.Allocation.Width;
            child.Allocation.Height = this.Allocation.Height;
            child.Layout ();
        }, this);
    }

    this.__defineGetter__ ("ChildCount", function () this.Children.length);
}



function MtkWindow (settings) {
    MtkContainer.call (this, settings);

    this.Xaml = this.Control.Content.Root;
    this.Xaml["Background"] = "green";

    var self = this;
    this.Allocation = { 
        get Width ()   { return self.Control.Content.ActualWidth; },
        set Width (x)  { },
        get Height ()  { return self.Control.Content.ActualHeight;},
        set Height (x) { },
        get Top ()     { return 0; },
        set Top (x)    { },
        get Left ()    { return 0; },
        set Left (x)   { }
    };

    this.BaseLayout = this.Layout; 
    this.Layout = function () {
        this.Xaml.Width = this.Allocation.Width;
        this.Xaml.Height = this.Allocation.Height;
        this.BaseLayout ();
    };

    this.Control.Content.OnResize = delegate (this, function () {
        this.Layout ();
    });
}



function MtkBox (settings) {
    MtkContainer.call (this, settings);
    this.CreateXaml ("<Canvas/>");
    var color = "sc#" +
        Math.random ().toString () + "," +
        Math.random ().toString () + "," +
        Math.random ().toString ();
    this.Xaml["Background"] = color;

    this.Padding = 5;
    this.Spacing = 10;

    this.PackStart = function (widget, expand) {
        widget.Settings.MtkBoxExpand = expand;
        this.AddChild (widget);
    };

    this.__defineGetter__ ("SizeRequest", function () {
        var request = {};
        request[this.VariableDimension] = this.Padding + this.ChildCount * this.Spacing;
        request[this.StaticDimension] = 0;
        this.Children.forEach (function (child) {
            if (child.SizeRequest[this.StaticDimension] > request[this.StaticDimension]) {
                request[this.StaticDimension] = child.SizeRequest[this.StaticDimension];
            }
        }, this);
        request[this.StaticDimension] += this.Padding;
        return request;
    });

    this.Layout = function () {
        var variable_offset = this.Padding;
        var static_offset = this.Padding;

        var static_space = 0;
        var flex_space = 0;
        var flex_count = 0;

        this.Children.forEach (function (child) {
            static_space += child.Settings.MtkBoxExpand ? 0 : child.SizeRequest[this.VariableDimension];
            flex_count += child.Settings.MtkBoxExpand ? 1 : 0;
        }, this);

        flex_space = this.Allocation[this.VariableDimension] - static_space - 
            (this.ChildCount - 1) * this.Spacing - 2 * this.Padding;

        this.Children.forEach (function (child) {
            child.Layout ();

            child.Allocation[this.VariableOffset] = variable_offset;
            child.Allocation[this.StaticOffset] = static_offset;

            if (child.Settings.MtkBoxExpand && flex_count > 0) {
                var size = flex_space / flex_count--;
                flex_space -= size;
                if (flex_count == 0) {
                    size += flex_space;
                }
                
                child.Allocation[this.VariableDimension] = size;
            } else {
                child.Allocation[this.VariableDimension] = child.SizeRequest[this.VariableDimension];
            }

            child.Allocation[this.StaticDimension] = this.Allocation[this.StaticDimension] - 2 * this.Padding;

            variable_offset += child.Allocation[this.VariableDimension] + this.Spacing;
        }, this);
    };
} 



function MtkHBox (settings) {
    MtkBox.call (this, settings);
    this.StaticDimension = "Height";
    this.VariableDimension = "Width";
    this.StaticOffset = "Top";
    this.VariableOffset = "Left";
}



function MtkVBox (settings) {
    MtkBox.call (this, settings);
    this.StaticDimension = "Width";
    this.VariableDimension = "Height";
    this.StaticOffset = "Left";
    this.VariableOffset = "Top";
}

function MtkLabel (settings) {
    MtkWidget.call (this, settings);
    this.CreateXaml ("<TextBlock/>");

    this.MapProperties ([ 
        [ "Text", "QueueResize" ], 
        [ "FontFamily", "QueueResize" ],
        [ "FontSize", "QueueResize" ], 
        [ "FontStretch", "QueueResize" ],
        [ "FontStyle", "QueueResize" ],
        [ "FontWeight", "QueueResize" ],
        [ "TextWrapping", "QueueResize" ],
        [ "TextDecorations", "QueueResize" ]
    ]);
    
    this.__defineGetter__ ("SizeRequest", function () {
        var self = this;
        return { Width : self.Xaml.ActualWidth, Height: self.Xaml.ActualHeight };
    });

    if (settings && settings.Text) {
        this.Text = settings.Text;
    }
}


function MtkButton (settings) {
    MtkWidget.call (this, settings);

    this.xaml = null;
   
    this.Initialize = function () {
        var name = this.Name;
        this.CreateXaml ('\
            <Canvas Name="' + name + '" Background="green"> \
              <Rectangle RadiusX="2" RadiusY="2"> \
                <Rectangle.Fill> \
                  <LinearGradientBrush Name="' + name + 'Fill" StartPoint="0,0" EndPoint="0,1" Opacity="0"> \
                    <GradientStop Offset="0.0" Color="#7fff"/> \
                    <GradientStop Offset="0.2" Color="#6fff"/> \
                    <GradientStop Offset="0.8" Color="#0fff"/> \
                  </LinearGradientBrush> \
                </Rectangle.Fill> \
              </Rectangle> \
              <Rectangle RadiusX="2" RadiusY="2"> \
                <Rectangle.Stroke> \
                  <LinearGradientBrush Name="' + name + 'Border" StartPoint="0,0" EndPoint="0,1" Opacity="0"> \
                    <GradientStop Offset="0.0" Color="#afff"/> \
                    <GradientStop Offset="1.0" Color="#0fff"/> \
                  </LinearGradientBrush> \
                </Rectangle.Stroke> \
              </Rectangle> \
              <Canvas.Resources> \
                <Storyboard Name="' + name + 'Storyboard" Storyboard.TargetProperty="Opacity" Duration="0:0:0.3"> \
                  <DoubleAnimation Name="' + name + 'BorderAnimation" Storyboard.TargetName="' + name + 'Border"/> \
                  <DoubleAnimation Name="' + name + 'FillAnimation" Storyboard.TargetName="' + name + 'Fill"/> \
                </Storyboard> \
              </Canvas.Resources> \
            </Canvas> \
        ');
        
        this.Xaml.AddEventListener ("mouseenter", delegate (this, function (o, args) {
            this.Animate ([o.FindName (o.Name + "FillAnimation"), 
                o.FindName (o.Name + "BorderAnimation")], 1);
            o.FindName (o.Name + "Storyboard").Begin ();
        }));
        
        this.Xaml.AddEventListener ("mouseleave", delegate (this, function (o, args) {
            this.Animate ([o.FindName (o.Name + "FillAnimation"), 
                o.FindName (o.Name + "BorderAnimation")], 0);
            o.FindName (o.Name + "Storyboard").Begin ();
        }));
    };

    this.Initialize ();

    this.Layout = function () {
        for (var i = 0; i < 2; i++) {
            this.Xaml.Children.GetItem (i).Width = this.Allocation.Width;
            this.Xaml.Children.GetItem (i).Height = this.Allocation.Height;
        }
    };

    this.__defineGetter__ ("SizeRequest", function () { return { Width: 50, Height: 40 } });
}

