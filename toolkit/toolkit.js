function delegate (target, callback) function () callback.apply (target, arguments);

function Bind (control) {
    MtkContext.SilverlightOnLoad (control);

    new MtkWindow (function () {
        this.Add (new MtkVBox (function () {
            this.PackStart (new MtkMediaElement, true);
            this.PackStart (new MtkControlBar (function () {
                this.PackStart (new MtkPlayPauseButton ({
                    Events: { "click": function () alert ("OMG!") }
                }));
                this.PackStart (new MtkSlider);
                this.PackStart (new MtkButton ({
                    With: function () this.Add (new MtkXaml ('<Canvas Width="50" Height="16" Background="purple"/>')),
                    Events: { "click": function (o) o.Parent.Remove (o) }
                }));
                this.PackStart (new MtkButton (new MtkLabel ({ Text: "Click Me!" })));
                this.PackStart (new MtkButton (function () this.Add (new MtkLabel ({ Text: "Another Button" }))));
                this.PackStart (new MtkLabel ("Label on the toolbar"));
            }));
        }));
    });
}

function MtkControlBar (settings) {
    this.XamlInitSource = '\
        <Canvas> \
            <Canvas.Background> \
                <LinearGradientBrush StartPoint="0,0" EndPoint="0,1"> \
                    <GradientStop Offset="0.0" Color="#f7f7f7"/> \
                    <GradientStop Offset="0.5" Color="#e6e6e6"/> \
                    <GradientStop Offset="0.5" Color="#ddd"/> \
                    <GradientStop Offset="1.0" Color="#999"/> \
                </LinearGradientBrush> \
            </Canvas.Background> \
        </Canvas> \
    ';

    MtkHBox.call (this, settings);

    this.Spacing = 3;
    this.Padding = 3;

    this.AfterConstructed ();
}

function MtkSlider (settings) {
    MtkWidget.call (this, settings);
    this.InitFromXaml ("<Canvas/>");
    this.AfterConstructed ();
}

var MtkContext = {    
    XamlHost: null,
    SilverlightOnLoad: function (control) {
        this.XamlHost = control.GetHost ();
    }
};

var MtkUtils = {
    IsWidget: function (o) o && o instanceof Object && o.IsMtkWidget,
    
    ScreenDpi: 96,

    GetFontForHtmlDomElement: function (elem) {
        if (!elem || !document.defaultView || !document.defaultView.getComputedStyle) {
            return {};
        }

        var style = document.defaultView.getComputedStyle (elem, null);
        if (!style || !style.getPropertyValue) {
            return {};
        }
        
        var family = style.getPropertyValue ("font-family");

        var computed_size = 0;
        var size = /^([0-9]+)([a-z]*)$/.exec (style.getPropertyValue ("font-size"));
        if (size && size.length > 1) {
            var size_value = parseInt (size[1]);
            if (size_value > 0 && size.length > 2 && size[2] == "px") {
                computed_size = size_value * (72 / MtkUtils.ScreenDpi);
                MoonConsole.Log ("FontSize: " + computed_size + "pt = " + size_value + "px @ " + MtkUtils.ScreenDpi + "dpi");
            } else if (size_value > 3) {
                // we'll just assume the unit is in pt already,
                // and it's of a reasonable size to be visible
                computed_size = size_value;
            }
        }

        return { FontFamily: family, FontSize: computed_size };
    },

    GetDefaultFont: function () {
        return MtkUtils.GetFontForHtmlDomElement (document.body);
    },

    GetDefaultXamlFontAttributes: function () {
        var str = "";
        var font = MtkUtils.GetDefaultFont ();
        for (var attr in font) {
            str += attr.toString () + "=\"" + font[attr].toString () + "\" ";
        }
        return str;
    },

    GetDefaultTextBlockXaml: function () "<TextBlock " + MtkUtils.GetDefaultXamlFontAttributes () + " />"
};

function MtkWidget (settings) {

    var xaml_host = settings instanceof Object ? settings.XamlHost : null;

    // Properties
    this.Control = xaml_host || MtkContext.XamlHost;
    this.Xaml = null;
    this.Settings = {};
    this.InitSettings = settings;
    this.Parent = null;
    this.IsRealized = false;
    this.IsMtkWidget = true;

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
        if (animations instanceof Array) {
            for (var i = 0, n = animations.length; i < n && animations[i]; i++) {
                animations[i].To = to_value;
            }
        }
    };

    this.InitFromXaml = function (xaml) this.Xaml = this.Control.Content.createFromXaml (xaml);
    this.CreateXaml = function (xaml) this.Control.Content.createFromXaml (xaml);

    this.QueueResize = function () {
        var parent = this.Parent;
        while (parent && parent.Parent) {
            parent = parent.Parent;
        }
        if (parent) {
            parent.OnRender ();
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
        "IsHitTestVisible", "Opacity", "OpacityMask", 
        "Resources", "Tag", "Triggers"
    ]);

    this.OnRender = function () { };

    this.OnSizeRequest = function () {
        var self = this;
        return { Width: self.Xaml.Width, Height: self.Xaml.Height };
    };

    this.__defineGetter__ ("SizeRequest", function () this.OnSizeRequest ());
    
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

    this.AfterConstructed = function () {
        // Only execute this function if the most derived object calls it
        if (this.constructor.name != arguments.callee.caller.name) {
            return;
        }

        if (this.InitSettings instanceof Function) {
            this.InitSettings.call (this);
        } else if (this.InitSettings instanceof Object) {
            for (var name in this.InitSettings.Events) {
                this.AddEventListener (name, this.InitSettings.Events[name]);
            }

            if (this.InitSettings.With instanceof Function) {
                this.InitSettings.With.call (this);
            }
        }

        delete this["AfterConstructed"];
    }
};

MtkWidget.Instances = 0;

function MtkMediaElement (settings) {
    MtkWidget.call (this, settings);
    this.InitFromXaml ("<MediaElement/>");
    this.AfterConstructed ();
}


function MtkXaml (xaml, settings) {
    MtkWidget.call (this, settings);
    this.InitFromXaml (xaml);
    this.MapProperties (["Background"]);
    this.AfterConstructed ();
}


function MtkContainer (settings) {
    MtkWidget.call (this, settings);

    // Properties
    this.Children = [];
    this.Padding = 0;
    this.InnerPadding = 0;

    this.Add = function (widget, before) {
        if (this.Xaml && widget && widget.Xaml && this.Children.indexOf (widget) < 0) {
            this.Xaml.Children.Add (widget.Xaml);
            this.Children.push (widget);
            widget.Parent = this;
            this.OnRender ();
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
            this.OnRender ();
        }
    };

    this.OnSizeRequest = function () {
        var request = { Width: 0, Height: 0 };
        this.Children.forEach (function (child) {
            var sr = child.SizeRequest;
            request.Width = Math.max (sr.Width, request.Width);
            request.Height = Math.max (sr.Height, request.Height);
        }, this);
        request.Width += 2 * this.TotalPadding;
        request.Height += 2 * this.TotalPadding;
        return request;
    };

    this.OnRender = function () {
        if (!this.IsRealized) {
            return;
        }

        this.Children.forEach (function (child) {
            child.Allocation.Left = this.TotalPadding;
            child.Allocation.Top = this.TotalPadding;
            child.Allocation.Width = this.Allocation.Width - 2 * this.TotalPadding;
            child.Allocation.Height = this.Allocation.Height - 2 * this.TotalPadding;
            child.IsRealized = true;
            child.OnRender ();
        }, this);
    };

    this.__defineGetter__ ("ChildCount", function () this.Children.length);
    this.__defineGetter__ ("TotalPadding", function () this.Padding + this.InnerPadding);

    this.AfterConstructed ();
}



function MtkWindow (settings) {
    MtkContainer.call (this, settings);

    this.Xaml = this.Control.Content.Root;

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

    this.BaseOnRender = this.OnRender; 
    this.OnRender = function () {
        this.Xaml.Width = this.Allocation.Width;
        this.Xaml.Height = this.Allocation.Height;
        this.IsRealized = true;
        this.BaseOnRender ();
    };

    this.Control.Content.OnResize = delegate (this, function () {
        this.OnRender ();
    });

    this.AfterConstructed ();
}



function MtkBox (settings) {
    MtkContainer.call (this, settings);

    this.Spacing = 0;

    this.InitFromXaml (this.XamlInitSource || "<Canvas/>");

    this.PackStart = function (widget, expand) {
        widget.Settings.MtkBoxExpand = expand;
        this.Add (widget);
    };

    this.OnSizeRequest = function () {
        var request = {};
        request[this.VariableDimension] = 2 * this.TotalPadding + this.ChildCount * this.Spacing;
        request[this.StaticDimension] = 0;
        this.Children.forEach (function (child) {
            var sr = child.SizeRequest[this.StaticDimension];
            request[this.StaticDimension] = Math.max (sr, request[this.StaticDimension]);
        }, this);
        request[this.StaticDimension] += 2 * this.TotalPadding;
        return request;
    };

    this.OnRender = function () {
        if (!this.IsRealized) {
            return;
        }

        var variable_offset = this.TotalPadding;
        var static_offset = this.TotalPadding;

        var static_space = 0;
        var flex_space = 0;
        var flex_count = 0;

        this.Children.forEach (function (child) {
            static_space += child.Settings.MtkBoxExpand ? 0 : child.SizeRequest[this.VariableDimension];
            flex_count += child.Settings.MtkBoxExpand ? 1 : 0;
        }, this);

        flex_space = this.Allocation[this.VariableDimension] - static_space - 
            (this.ChildCount - 1) * this.Spacing - 2 * this.TotalPadding;
        if (flex_space < 0) {
            flex_space = 0;
        }
        
        this.Children.forEach (function (child) {
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

            child.Allocation[this.StaticDimension] = this.Allocation[this.StaticDimension] - 2 * this.TotalPadding;

            variable_offset += child.Allocation[this.VariableDimension] + this.Spacing;

            child.IsRealized = true;
            child.OnRender ();
        }, this);
    };

    this.AfterConstructed ();
} 

function MtkHBox (settings) {
    MtkBox.call (this, settings);
    this.StaticDimension = "Height";
    this.VariableDimension = "Width";
    this.StaticOffset = "Top";
    this.VariableOffset = "Left";
    this.AfterConstructed ();
}

function MtkVBox (settings) {
    MtkBox.call (this, settings);
    this.StaticDimension = "Width";
    this.VariableDimension = "Height";
    this.StaticOffset = "Left";
    this.VariableOffset = "Top";
    this.AfterConstructed ();
}

function MtkLabel (settings) {
    MtkWidget.call (this, settings);

    this.InitFromXaml (MtkUtils.GetDefaultTextBlockXaml ());

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
    
    this.OnSizeRequest = function () {
        var self = this;
        return { Width : Math.ceil (self.Xaml.ActualWidth), 
            Height: Math.ceil (self.Xaml.ActualHeight) };
    };

    if (typeof settings == "string") {
        this.Text = settings;
    } else if (settings && settings.Text) {
        this.Text = settings.Text;
    }

    this.AfterConstructed ();
}


function MtkButton (settings) {
    var init_child = null;
    if (MtkUtils.IsWidget (settings)) {
        MtkContainer.call (this);
        init_child = settings;
    } else {
        MtkContainer.call (this, settings);
    }

    this.xaml = null;
    this.RestOpacity = 0.4;
    this.FocusOpacity = 1.0;
    this.InnerPadding = 5;

    this.FillOffsets = [ 0.0, 0.5, 0.5, 1.0 ];
    this.FillColors = [ "#e8e8e8", "#e0e0e0", "#d8d8d8", "#cdcdcd" ];
    this.LightFillColors = [ "#e1e1e1", "#ececec", "#f4f4f4", "#f0f0f0" ];

    this.IsPressed = false;

    this.Initialize = function () {
        this.InitFromXaml ('\
            <Canvas Name="' + this.Name + '"> \
              <Canvas Name="' + this.Name + 'Style"> \
              <Rectangle RadiusX="3" RadiusY="3" Stroke="#888"> \
                <Rectangle.Fill> \
                  <LinearGradientBrush StartPoint="0,0" EndPoint="0,1" Name="' + this.Name + 'Fill"/> \
                </Rectangle.Fill> \
              </Rectangle> \
              <Rectangle RadiusX="2" RadiusY="2" Canvas.Left="1" Canvas.Top="1" Stroke="#7fff"/> \
              </Canvas> \
              <Canvas.Resources> \
                <Storyboard Name="' + this.Name + 'Storyboard" Storyboard.TargetProperty="Opacity"> \
                  <DoubleAnimation Name="' + this.Name + 'StyleAnimation" Storyboard.TargetName="' + this.Name + 'Style" Duration="0:0:0.2"/> \
                </Storyboard> \
              </Canvas.Resources> \
            </Canvas> \
        ');
        
        this.Xaml.AddEventListener ("mouseenter", delegate (this, function (o, args) {
            this.Animate ([o.FindName (o.Name + "StyleAnimation")], this.FocusOpacity);
            var storyboard = o.FindName (o.Name + "Storyboard");
            if (storyboard) {
                storyboard.Begin ();
            }
        }));
        
        this.Xaml.AddEventListener ("mouseleave", delegate (this, function (o, args) {
            this.Animate ([o.FindName (o.Name + "StyleAnimation")], this.RestOpacity);
            var storyboard = o.FindName (o.Name + "Storyboard");
            if (storyboard) {
                storyboard.Begin ();
            }

            if (this.IsPressed) {
                this.FillButton (o, this.FillColors);
            }
            this.IsPressed = false;
        }));

        this.Xaml.AddEventListener ("mouseleftbuttondown", delegate (this, function (o, args) {
            this.IsPressed = true;
            this.FillButton (o, this.LightFillColors);
        }));

        this.Xaml.AddEventListener ("mouseleftbuttonup", delegate (this, function (o, args) {
            this.IsPressed = false;
            this.FillButton (o, this.FillColors);
            this.RaiseEvent ("click");
        }));

        var fill = this.Xaml.FindName (this.Name + "Fill").GradientStops;
        for (var i = 0, n = Math.min (this.FillColors.length, this.FillOffsets.length); i < n; i++) {
            var stop = this.CreateXaml ("<GradientStop/>");
            stop.Color = this.FillColors[i];
            stop.Offset = this.FillOffsets[i];
            fill.Add (stop);
        }

        this.Xaml.FindName (this.Name + "Style").Opacity = this.RestOpacity;
        this.Xaml.Cursor = "Hand";
    };

    this.FillButton = function (o, colors) {
        var stops = o.FindName (this.Name + "Fill").GradientStops;
        for (var i = 0, n = Math.min (colors.length, stops.Count); i < n; i++) {
            stops.GetItem (i).Color = colors[i];
        }
    };

    this.BaseOnRender = this.OnRender;
    this.OnRender = function () {
        if (!this.IsRealized) {
            return;
        }

        var style = this.Xaml.FindName (this.Name + "Style");
        var fill = style.Children.GetItem (0);
        var inner_stroke = style.Children.GetItem (1);

        var width = this.Allocation.Width;
        var height = this.Allocation.Height;

        fill.Width = width; fill.height = height;
        inner_stroke.Width = width - 2; inner_stroke.Height = height - 2;

        this.BaseOnRender ();
    };

    this.Initialize ();
    if (init_child) {
        this.Add (init_child);
    }
    this.AfterConstructed ();
}


function MtkPlayPauseButton (settings) {
    MtkButton.call (this, settings);

    this.Icon = new MtkXaml ('\
        <Canvas Name="PlayPauseIcons" Width="16" Height="16"> \
          <Canvas Name="PlayIcon" Width="14" Height="16" Opacity="1" Canvas.Left="1"> \
            <Path Stroke="#26000000" StrokeThickness="1.99999774" StrokeMiterLimit="4" StrokeDashOffset="0" StrokeLineJoin="Round" StrokeEndLineCap="Square" Data="M 0.999999 14.999913 L 0.999999 0.99999339 L 12.999799 7.8012334 L 0.999999 14.999913 z"/> \
            <Path Fill="#FFD3D7CF" StrokeThickness="1.00000036" StrokeMiterLimit="4" StrokeDashOffset="0" StrokeLineJoin="Round" StrokeEndLineCap="Square" Data="M 1.229899 14.224863 L 1.229899 1.4590134 L 12.324439 7.8419334 L 1.229899 14.224863 z"/> \
            <Path Stroke="#FF464744" StrokeThickness="1.00000012" StrokeMiterLimit="4" StrokeDashOffset="0" StrokeLineJoin="Round" StrokeEndLineCap="Square" Data="M 1.229899 14.224863 L 1.229899 1.4590134 L 12.324439 7.8419334 L 1.229899 14.224863 z"/> \
            <Path Fill="#FFFFFFFF" StrokeThickness="3" StrokeMiterLimit="4" StrokeDashOffset="0" StrokeLineJoin="Miter" StrokeEndLineCap="Square" Data="M 1.460049 1.8604134 L 1.460049 13.823453 L 11.859759 7.8419334 L 1.460049 1.8604134 z M 1.920339 2.6636834 L 10.924789 7.8419334 L 1.920339 13.020173 L 1.920339 2.6636834 z"/> \
            <Path Fill="#80FFFFFF" StrokeThickness="2" StrokeMiterLimit="10" StrokeDashOffset="0" StrokeLineJoin="Round" StrokeEndLineCap="Round" Data="M 1.891819 2.6352334 L 1.891819 7.9999534 C 3.856899 7.9793934 6.110009 7.8413334 9.745539 7.1393034 L 1.891819 2.6352334 z"/> \
            <Canvas.Resources> \
              <Storyboard Name="PlayIconStoryboard"  \
                Storyboard.TargetProperty="Opacity"  \
                Storyboard.TargetName="PlayIcon"> \
                <DoubleAnimation Name="PlayIconAnimation" Duration="0:0:0.25"/> \
              </Storyboard> \
            </Canvas.Resources> \
          </Canvas> \
          <Canvas Name="PauseIcon" Width="16" Height="16" Opacity="0"> \
            <Path Stroke="#26000000" StrokeThickness="1.99999952000000003" StrokeMiterLimit="4" StrokeDashOffset="0" StrokeLineJoin="Round" StrokeEndLineCap="Square" Data="M 9.28215 1.0034651 L 9.28215 14.931205 L 14.6887 14.931205 L 14.6887 1.0034651 L 9.28215 1.0034651 z"/> \
            <Path Fill="#FFCDD1C8" StrokeThickness="1" StrokeMiterLimit="4" StrokeDashOffset="0" StrokeLineJoin="Miter" StrokeEndLineCap="Square" Data="M 9.53515 1.3660051 L 9.53515 14.568705 L 14.43568 14.568705 L 14.43568 1.3660051 L 9.53515 1.3660051 z"/> \
            <Path Stroke="#FF626460" StrokeThickness="1.00000024000000010" StrokeMiterLimit="4" StrokeDashOffset="0" StrokeLineJoin="Round" StrokeEndLineCap="Square" Data="M 9.5351497 1.3673851 L 9.5351497 14.627965 L 14.43568 14.627965 L 14.43568 1.3673851 L 9.5351497 1.3673851 z"/> \
            <Path Stroke="#96FFFFFF" StrokeThickness="0.99999963999999997" StrokeMiterLimit="4" StrokeDashOffset="0" StrokeLineJoin="Miter" StrokeEndLineCap="Square" Data="M 10.14772 1.994705 L 10.14772 13.940005 L 13.82311 13.940005 L 13.82311 1.994705 L 10.14772 1.994705 z"/> \
            <Path Fill="#FFF7F7F7" StrokeThickness="2" StrokeMiterLimit="10" StrokeDashOffset="0" StrokeLineJoin="Round" StrokeEndLineCap="Round" Data="M 10.46595 2.332325 L 10.46595 7.604375 L 13.52507 7.215385 L 13.52507 2.276755 L 10.46595 2.332325 z"/> \
            <Path Stroke="#26000000" StrokeThickness="1.99999940000000009" StrokeMiterLimit="4" StrokeDashOffset="0" StrokeLineJoin="Round" StrokeEndLineCap="Square" Data="M 0.9999997 0.99999508 L 0.9999997 14.934705 L 6.4095197 14.934705 L 6.4095197 0.99999508 L 0.9999997 0.99999508 z"/> \
            <Path Fill="#FFCDD1C8" StrokeThickness="1" StrokeMiterLimit="4" StrokeDashOffset="0" StrokeLineJoin="Miter" StrokeEndLineCap="Square" Data="M 1.25315 1.3627251 L 1.25315 14.572035 L 6.15636 14.572035 L 6.15636 1.3627251 L 1.25315 1.3627251 z"/> \
            <Path Stroke="#FF626460" StrokeThickness="1.00000011999999994" StrokeMiterLimit="4" StrokeDashOffset="0" StrokeLineJoin="Round" StrokeEndLineCap="Square" Data="M 1.2531497 1.3641051 L 1.2531497 14.631315 L 6.1563597 14.631315 L 6.1563597 1.3641051 L 1.2531497 1.3641051 z"/> \
            <Path Stroke="#96FFFFFF" StrokeThickness="0.99999963999999997" StrokeMiterLimit="4" StrokeDashOffset="0" StrokeLineJoin="Miter" StrokeEndLineCap="Square" Data="M 1.8660497 1.9917351 L 1.8660497 13.943005 L 5.5434597 13.943005 L 5.5434597 1.9917351 L 1.8660497 1.9917351 z"/> \
            <Path Fill="#FFF7F7F7" StrokeThickness="2" StrokeMiterLimit="10" StrokeDashOffset="0" StrokeLineJoin="Round" StrokeEndLineCap="Round" Data="M 2.18446 2.329525 L 2.18446 8.660565 L 5.24525 8.271385 L 5.24525 2.273935 L 2.18446 2.329525 z"/> \
            <Canvas.Resources> \
              <Storyboard Name="PauseIconStoryboard"  \
                Storyboard.TargetProperty="Opacity"  \
                Storyboard.TargetName="PauseIcon"> \
                <DoubleAnimation Name="PauseIconAnimation" Duration="0:0:0.25"/> \
              </Storyboard> \
            </Canvas.Resources> \
          </Canvas> \
        </Canvas> \
    ', this.XamlHost);

    this.Add (this.Icon);
    this.AfterConstructed ();
};

