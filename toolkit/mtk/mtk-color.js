var MtkColor = {

    //
    // Format Conversions
    //

    FromInt: function (value, is_argb) { 
        var c = value;
        if (c <= 0xffffff) {
            c = (c << 8) | 0xff;
            is_argb = false;
        } else if (c <= 0xfffffff) {
            c = (c << 4) | 0xf;
            is_argb = false;
        }
    
        return is_argb 
            ? { a: (c >> 24) & 0xff,
                r: (c >> 16) & 0xff,
                g: (c >> 8)  & 0xff,
                b: (c >> 0)  & 0xff }
            : { r: (c >> 24) & 0xff,
                g: (c >> 16) & 0xff,
                b: (c >> 8)  & 0xff,
                a: (c >> 0)  & 0xff };
    },

    ReadChannel: function (hi_c, lo_c) {
        var hi = parseInt (hi_c, 16);
        var lo = hi;
        if (isNaN (hi) || hi < 0 || hi > 0xff) {
            return Number.NaN;
        }

        if (lo_c) {
            lo = parseInt (lo_c, 16);
            if (isNaN (lo) || lo < 0 || lo > 0xff) {
                return Number.NaN;
            }
        }
        
        return (hi << 4) | lo;
    },

    FromString: function (str, is_argb) {
        var err_color = { r: 0, g: 0, b: 0, a: 0xff };
        if (typeof str != "string") {
            return err_color;
        }

        if (str.charAt (0) == '#') {
            switch (str.length) {
                case 4: // #rgb
                    color = [ 
                        MtkColor.ReadChannel (str.charAt (1)),
                        MtkColor.ReadChannel (str.charAt (2)),
                        MtkColor.ReadChannel (str.charAt (3)),
                        0xff
                    ];
                    break;
                case 5: // #rgba
                    color = [ 
                        MtkColor.ReadChannel (str.charAt (1)),
                        MtkColor.ReadChannel (str.charAt (2)),
                        MtkColor.ReadChannel (str.charAt (3)),
                        MtkColor.ReadChannel (str.charAt (4))
                    ];
                    break;
                case 7: // #rrggbb
                    color = [ 
                        MtkColor.ReadChannel (str.charAt (1), str.charAt (2)),
                        MtkColor.ReadChannel (str.charAt (3), str.charAt (4)),
                        MtkColor.ReadChannel (str.charAt (5), str.charAt (6)),
                        0xff
                    ];
                    break;
                case 9: // #rrggbbaa
                    color = [ 
                        MtkColor.ReadChannel (str.charAt (1), str.charAt (2)),
                        MtkColor.ReadChannel (str.charAt (3), str.charAt (4)),
                        MtkColor.ReadChannel (str.charAt (5), str.charAt (6)),
                        MtkColor.ReadChannel (str.charAt (7), str.charAt (8))
                    ];
                    break;
                default:
                    return err_color;
            }
        } else if (str.length >= 10 && str.charAt (0) == 'r' && 
            str.charAt (1) == 'g' && str.charAt (2) == 'b') {
            var color = null;
            var tok = "";
            var channel = 0;
            for (var i = 3; i < str.length; i++) {
                var c = str.charAt (i);
                if (!color) {
                    if (c == '(') {
                        color = [];
                    }
                } else if (c == ',' || c == ')') {
                    color[channel++] = parseInt (tok);
                    tok = "";
                    if (c == ')') {
                        break;
                    }
                } else if (c != ' ' && c != '\t') {
                    tok += c;
                }
            }
            color.push (0xff);
            is_argb = false;
        }
        
        for (var i = 0; i < 4; i++) {
            if (isNaN (color[i])) {
                return err_color;
            }
        }

        return is_argb
            ? { r: color[1], g: color[2], b: color[3], a: color[0] }
            : { r: color[0], g: color[1], b: color[2], a: color[3] };
    },

    ToString: function (color) {
        if (typeof color == "number") {
            color = MtkColor.FromInt (color);
        } else if (!color || typeof color.r != "number" || typeof color.g != "number" ||
            typeof color.b != "number") {
            return "#000";
        }

        var c_a = typeof color.a != "number" ? 0xff : color.a;
        
        var r = color.r.toString (16); if (r.length < 2) r = "0" + r;
        var g = color.g.toString (16); if (g.length < 2) g = "0" + g;
        var b = color.b.toString (16); if (b.length < 2) b = "0" + b;
        var a = c_a.toString (16);     if (a.length < 2) a = "0" + a;
        if (r.charAt (0) == r.charAt (1) &&
            g.charAt (0) == g.charAt (1) &&
            b.charAt (0) == b.charAt (1) &&
            a.charAt (0) == a.charAt (1)) {
            r = r.charAt (0);
            g = g.charAt (0);
            b = b.charAt (0);
            a = a.charAt (0);
        }

        var color = "#" + r + g + b;
        if (a != "ff" && a != "f") {
            color += a;
        }

        return color;
    },

    //
    // Shading/Value Adjustment
    //

    Clamp: function (x, lo, hi) (x > hi) ? hi : (x < lo ? lo : x),

    Shade: function (color, d) { return {
        r: MtkColor.Clamp (Math.round (color.r * d), 0, 0xff),
        g: MtkColor.Clamp (Math.round (color.g * d), 0, 0xff),
        b: MtkColor.Clamp (Math.round (color.b * d), 0, 0xff),
        a: color.a || 0xff
    }},

    Lighter: function (color) MtkColor.Shade (color, 1.3),
    Darker: function (color) MtkColor.Shade (color, 0.7)
};

