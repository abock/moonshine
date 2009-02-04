function delegate (target, callback) function () callback.apply (target, arguments);

function Bind (control) {
    MtkContext.SilverlightOnLoad (control);

    var win = new MtkWindow;
    var container = new MtkVBox;
    var controls = new MtkHBox;

    container.PackStart (new MtkCanvas, true);

    controls.PackStart (new MtkCanvas);
    controls.PackStart (new MtkCanvas);
    controls.PackStart (new MtkCanvas);
    container.PackStart (controls);

    container.PackStart (new MtkCanvas, true);

    win.AddChild (container);
}



var MtkContext = {
    
    XamlHost: null,

    SilverlightOnLoad: function (control) {
        this.XamlHost = control.GetHost ();
    }
};



function MtkWidget (control) {

    // Properties
    this.Control = control || MtkContext.XamlHost;
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

    this.Layout = function () { };

    this.SizeRequest = { Width: -1, Height: -1 };

    var self = this;
    this.Allocation = { 
        get Width ()   { return self.Xaml ? self.Xaml.Width : 0 },
        set Width (x)  { if (self.Xaml) self.Xaml.Width = x; },
        get Height ()  { return self.Xaml ? self.Xaml.Height : 0 },
        set Height (x) { if (self.Xaml) self.Xaml.Height = x; }
    };
};

MtkWidget.Instances = 0;



function MtkCanvas (control) {
    MtkWidget.call (this, control);
    this.CreateXaml ("<Canvas/>");
    var color = "sc#" +
        Math.random ().toString () + "," +
        Math.random ().toString () + "," +
        Math.random ().toString ();
    this.Xaml["Background"] = color;

    this.SizeRequest = { Width: 30, Height: 30 };
}



function MtkContainer (control) {
    MtkWidget.call (this, control);

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
            child.Xaml["Canvas.Left"] = this.Xaml["Canvas.Left"];
            child.Xaml["Canvas.Top"] = this.Xaml["Canvas.Top"];
            child.Allocation.Width = this.Allocation.Width;
            child.Allocation.Height = this.Allocation.Height;
            child.Layout ();
        }, this);
    }

    this.__defineGetter__ ("ChildCount", function () this.Children.length);
}



function MtkWindow (control) {
    MtkContainer.call (this, control);

    this.Xaml = this.Control.Content.Root;
    this.Xaml["Background"] = "green";

    var self = this;
    this.Allocation = { 
        get Width ()   { return self.Control.Content.ActualWidth; },
        set Width (x)  { },
        get Height ()  { return self.Control.Content.ActualHeight;},
        set Height (x) { }
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



function MtkBox (control) {
    MtkContainer.call (this, control);
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

            child.Xaml[this.VariableOffset] = variable_offset;
            child.Xaml[this.StaticOffset] = static_offset;

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



function MtkHBox (control) {
    MtkBox.call (this, control);
    this.StaticDimension = "Height";
    this.VariableDimension = "Width";
    this.StaticOffset = "Canvas.Top";
    this.VariableOffset = "Canvas.Left";
}



function MtkVBox (control) {
    MtkBox.call (this, control);
    this.StaticDimension = "Width";
    this.VariableDimension = "Height";
    this.StaticOffset = "Canvas.Left";
    this.VariableOffset = "Canvas.Top";
}


function MtkButton (control) {
    MtkWidget.call (this, control);

    this.xaml = null;
   
    this.Initialize = function () {
        var name = this.Name;
        this.CreateXaml ('\
            <Canvas Name="' + name + '" Width="27" Height="22" Background="green"> \
              <Rectangle Width="27" Height="22" RadiusX="2" RadiusY="2"> \
                <Rectangle.Fill> \
                  <LinearGradientBrush Name="' + name + 'Fill" StartPoint="0,0" EndPoint="0,1" Opacity="0"> \
                    <GradientStop Offset="0.0" Color="#7fff"/> \
                    <GradientStop Offset="0.2" Color="#6fff"/> \
                    <GradientStop Offset="0.8" Color="#0fff"/> \
                  </LinearGradientBrush> \
                </Rectangle.Fill> \
              </Rectangle> \
              <Rectangle Width="27" Height="22" RadiusX="2" RadiusY="2"> \
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
}

