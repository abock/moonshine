//
// This file is licensed under the MIT X11 open source license.
// http://www.opensource.org/licenses/mit-license.php
//
// Authors: Aaron Bockover <abockover@novell.com>
//
// Copyright 2009 Novell, Inc.
// 

var MtkStyle = {

    //
    // Style Loading
    //
    
    Notify: new MtkObject,

    Reload: function () {
        MtkStyle.ShadeColorsFromNormal (MtkStyle.DefaultColors);
        MtkStyle.system_colors = null;
        
        // Load the color scheme from the CSS named system colors
        
        try {
            var css_color_map = {
                "Window"          : "window_bg",
                "WindowText"      : "window_fg",
                "ButtonFace"      : "button_bg",
                "ButtonText"      : "button_fg",
                "ButtonShadow"    : "button_shadow",
                "ButtonHighlight" : "button_highlight",
                "Highlight"       : "highlight_bg",
                "HighlightText"   : "highlight_fg",
                "Scrollbar"       : "trough_bg"
            };
    
            var colors = {};
            var elem = document.createElement ("div");
          
            for (var css in css_color_map) {
                elem.style.color = css;
                var style = document.defaultView.getComputedStyle (elem, null);
                var color = style.getPropertyValue ("color");
                colors[css_color_map[css]] = { normal: MtkColor.FromString (color) };
            }
    
            MtkStyle.ShadeColorsFromNormal (colors);
            MtkStyle.system_colors = colors;
        } catch (e) {
            MtkConsole.Log ("Could not load system color scheme from CSS/DOM: " + e);
        }
        
        try {
            MtkStyle.LoadFont ();
        } catch (e) {
            MtkConsole.Log ("Could not load font data from CSS/DOM: " + e);
        }   
        
        MtkStyle.Notify.RaiseEvent ("reload");
    },
    
    //
    // Colors
    //
    
    DefaultColors: {
        /*bg:    { normal: MtkColor.FromInt (0xd8d8d8) },
        fg:    { normal: MtkColor.FromInt (0x444444) },
        focus: { normal: MtkColor.FromInt (0x4d9f0e) }*/
    },

    system_colors: null,
    get Colors () { return MtkStyle.system_colors || MtkStyle.DefaultColors; }, 

    ShadeColorsFromNormal: function (colors) {
        for (var set_name in colors) {
            var set = colors[set_name];
            set.light = MtkColor.Lighter (set.normal);
            set.dark = MtkColor.Darker (set.normal);
            set.lighter = MtkColor.Lighter (set.light);
            set.darker = MtkColor.Darker (set.dark);
            set.lightest = MtkColor.Lighter (set.lighter);
            set.darkest = MtkColor.Darker (set.darker);
        }
    },

    //
    // Font/Text
    //

    DefaultFont: {
        Family: "DejaVu Sans, sans-serif",
        Size: 11
    },
    
    system_font: null,
    get Font () { return MtkStyle.system_font || MtkStyle.DefaultFont; },
    
    ScreenDpi: 96, // FIXME: try to compute this
    
    LoadFont: function () {
        var elem = document.body;
        
        MtkStyle.system_font = null;
        
        if (!elem || !document.defaultView || !document.defaultView.getComputedStyle) {
            return;
        }

        var style = document.defaultView.getComputedStyle (elem, null);
        if (!style || !style.getPropertyValue) {
            return;
        }
        
        var family = style.getPropertyValue ("font-family");

        var computed_size = 0;
        var size = /^([0-9]+)([a-z]*)$/.exec (style.getPropertyValue ("font-size"));
        if (size && size.length > 1) {
            var size_value = parseInt (size[1]);
            if (size_value > 0 && size.length > 2 && size[2] == "px") {
                computed_size = size_value * (72 / MtkStyle.ScreenDpi);
            } else if (size_value > 3) {
                // we'll just assume the unit is in pt already,
                // and it's of a reasonable size to be visible
                computed_size = size_value;
            }
        }

        MtkStyle.system_font = { Family: family, Size: computed_size };
    },
    
    //
    // Drawing Utilities
    //
    
    GetColor: function (style, shade)
        MtkColor.ToString (MtkStyle.Colors[style][shade || "normal"]),
    
    CreateGradient: function (widget, style, inset, c, o) {
        var offsets = o || [ 0, 0.5, 0.5, 1 ];
        var colors = c || [ "lighter", "light", "normal", "dark" ];
        
        if (inset) {
            colors.reverse ();
        }
        
        for (var i = 0; i < colors.length; i++) {
            colors[i] = MtkStyle.GetColor (style, colors[i]);
        }
        
        return MtkStyle.CreateLinearGradient (widget, offsets, colors);
    },
    
    CreateLinearGradient: function (widget, offsets, colors, start_point, end_point) {
        var brush = widget.CreateXaml ("<LinearGradientBrush/>");
        brush.StartPoint = start_point || "0,0";
        brush.EndPoint = end_point || "0,1";
        
        for (var i = 0, n = Math.min (offsets.length, colors.length); i < n; i++) {
            brush.GradientStops.Add (MtkStyle.CreateGradientStop (widget, offsets[i], 
                typeof colors[i] != "string" ? MtkColor.ToString (colors[i]) : colors[i]
            ));
        }
                
        return brush;
    },
    
    CreateGradientStop: function (widget, offset, color) {
        var stop = widget.CreateXaml ("<GradientStop/>");
        stop.Offset = offset;
        stop.Color = color;
        return stop; 
    }
};

