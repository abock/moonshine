var MtkStyle = {

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

