var MtkStyle = {

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
        }
    },

    Reload: function () {
        MtkStyle.ShadeColorsFromNormal (MtkStyle.DefaultColors);
        
        MtkStyle.system_colors = null;

        var css_color_map = {
            "Window"        : "window_bg",
            "WindowText"    : "window_fg",
            "ButtonFace"    : "button_bg",
            "ButtonText"    : "button_fg",
            "Highlight"     : "highlight_bg",
            "HighlightText" : "hightlight_fg",
            "Scrollbar"     : "trough_bg"
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
    },

    CreateGradient: function (widget, style) {
        var offsets = [ 0, 0.4, 1 ];
        var colors =  [ "light", "normal", "dark"];

        var brush = widget.CreateXaml ("<LinearGradientBrush/>");
        brush.StartPoint = "0,0";
        brush.EndPoint = "0,1";

        for (var i = 0, n = Math.min (offsets.length, colors.length); i < n; i++) {
            var stop = widget.CreateXaml ("<GradientStop/>");
            stop.Color = MtkColor.ToString (MtkStyle.Colors[style][colors[i]]);
            stop.Offset = offsets[i];
            brush.GradientStops.Add (stop);
        }
        
        return brush;
    },

    //
    // Font/Text
    //

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
                computed_size = size_value * (72 / MtkStyle.ScreenDpi);
            } else if (size_value > 3) {
                // we'll just assume the unit is in pt already,
                // and it's of a reasonable size to be visible
                computed_size = size_value;
            }
        }

        return { FontFamily: "DejaVu Sans", FontSize: computed_size };
    },

    GetDefaultFont: function () {
        return MtkStyle.GetFontForHtmlDomElement (document.body);
    },

    GetDefaultXamlFontAttributes: function () {
        var str = "";
        var font = MtkStyle.GetDefaultFont ();
        for (var attr in font) {
            str += attr.toString () + "=\"" + font[attr].toString () + "\" ";
        }
        return str;
    },

    GetDefaultTextBlockXaml: function () "<TextBlock " + MtkStyle.GetDefaultXamlFontAttributes () + " />"
};

