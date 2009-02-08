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

    Mix: function (ca, cb, k) {
        var alpha_a = typeof ca.alpha == "number" ? ca.a : 0xff;
        var alpha_b = typeof cb.alpha == "number" ? cb.a : 0xff;
        return {
            r: MtkColor.Clamp (k * ca.r + (1.0 - k) * cb.r, 0, 0xff),
            g: MtkColor.Clamp (k * ca.g + (1.0 - k) * cb.g, 0, 0xff),
            b: MtkColor.Clamp (k * ca.b + (1.0 - k) * cb.b, 0, 0xff),
            a: MtkColor.Clamp (k * ca.a + (1.0 - k) * cb.a, 0, 0xff),
        };
    },

    Shade: function (color, k) {
        var alpha = (typeof color.a == "number") ? color.a : 0xff;
        var hls = MtkColor.RgbToHls (color.r, color.g, color.b);
        var rgb = MtkColor.HlsToRgb (hls[0], hls[1] * k, hls[2] * k);
        return { r: rgb[0], g: rgb[1], b: rgb[2], a: alpha };
    },

    Lighter: function (color) MtkColor.Shade (color, 1 + 0.15),
    Darker: function (color) MtkColor.Shade (color, 1 - 0.15),
    
    RgbToHls: function (r, g, b) {
        var min, max, delta;
        var h = 0, l, s = 0;
  
        if (r > g) {
            max = r > b ? r : b;
            min = g < b ? g : b;
        } else {
            max = g > b ? g : b;
            min = r < b ? r : b;
        }

        l = (max + min) / 2;
        if (max == min) {
            return [h, l, s];
        }
        
        s = l <= 0.5 
            ? (max - min) / (max + min)
            : (max - min) / (2 - max - min);
  
        delta = max - min;
        if      (r == max) h = (g - b) / delta;
        else if (g == max) h = 2 + (b - r) / delta;
        else if (b == max) h = 4 + (r - g) / delta;
  
        if ((h *= 60) < 0.0) {
            h += 360;
        }
  
        return [h, l, s];
    },

    HlsToRgb: function (h, l, s) {
        var h_angle = [h + 120, h, h - 120];
        var rgb = [l, l, l];
        
        var m2 = l <= 0.5
            ? l * (1 + s)
            : l + s - l * s;
        var m1 = 2 * l - m2;
        
        for (var i = 0; s != 0 && i < 3; i++) {
            h = h_angle[i];
            while (h > 360) h -= 360;
            while (h < 0)   h += 360;
            
            if      (h < 60)  rgb[i] = m1 + (m2 - m1) * h / 60;
            else if (h < 180) rgb[i] = m2;
            else if (h < 240) rgb[i] = m1 + (m2 - m1) * (240 - h) / 60;
            else              rgb[i] = m1;
        }
        
        for (var i = 0; i < 3; i++) {
            rgb[i] = MtkColor.Clamp (Math.round (rgb[i]), 0, 0xff);
        }
        
        return rgb;
    }
};

