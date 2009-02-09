//
// This file is licensed under the MIT X11 open source license.
// http://www.opensource.org/licenses/mit-license.php
//
// Authors: Aaron Bockover <abockover@novell.com>
//
// Copyright 2009 Novell, Inc.
// 

function MtkSlider (settings) {
    MtkWidget.call (this, settings);
   
    //
    // Properties
    //

    this.XPad = 0;
    this.YPad = 0;
    this.PillWidth = 4;
    this.TroughHeight = 6;
    this.TroughRadius = 3;
    this.SliderWidth = 24;
    this.SliderHeight = 12;
    this.SliderRadius = 4;
    this.MinWidth = 100;

    this.value = 0.0;
    this.__defineGetter__ ("Value", function () this.value);
    this.__defineSetter__ ("Value", function (x) {
        if (x < 0 || x > 1) {
            MtkConsole.Log ("Invalid MtkSlider.Value: " + x);
            x = x < 0 ? 0 : 1;
        }
        
        if (this.value != x) {
            this.value = x;
            this.PositionSlider ();
            this.OnValueChanged ();
        }
    });
    
    this.is_dragging = false;
    this.__defineGetter__ ("IsDragging", function () this.is_dragging);
    
    this.Virtual ("OnValueChanged", function () this.RaiseEvent ("ValueChanged", this.Value));
    
    this.Virtual ("OnDragBegin", function () {
        if (!this.is_dragging) {
            this.is_dragging = true;
            this.XamlFind ("Slider").CaptureMouse ();
            this.RaiseEvent ("DragBegin");
        }
    });
    
    this.Virtual ("OnDragEnd", function () {
        if (this.is_dragging) {
            this.is_dragging = false;
            this.XamlFind ("Slider").ReleaseMouseCapture ();
            this.RaiseEvent ("DragEnd");
        }
    });
    
    this.Virtual ("OnMouseDown", function (x, y) this.RaiseEvent ("MouseDown", x, y));
    this.Virtual ("OnMouseUp", function (x, y) this.RaiseEvent ("MouseUp", x, y));

    this.InitFromXaml ('<Canvas> \
        <Canvas Name="' + this.Name + 'Trough"> \
            <Rectangle/> <!-- trough empty --> \
            <Rectangle/> <!-- border empty --> \
            <Rectangle/> <!-- trough fill --> \
            <Rectangle/> <!-- border fill --> \
        </Canvas> \
        <Canvas Name="' + this.Name + 'Slider"> \
            <Rectangle/> <!-- bg --> \
            <Rectangle/> <!-- pill --> \
            <Rectangle/> <!-- border --> \
            <Rectangle Stroke="#4fff"/> <!-- highlight --> \
        </Canvas> \
    </Canvas>');
    
    //
    // Control
    //
    
    this._is_slider_prelit = false;
    this.__defineGetter__ ("is_slider_prelit", function () this._is_slider_prelit && this.SliderEnabled);
    this.__defineSetter__ ("is_slider_prelit", function (x) this._is_slider_prelit = x && this.SliderEnabled);
    
    this.slider_press_x = 0;
    
    this.Override ("OnRealize", function () {
        this.$OnRealize$ ();
        if (!this.IsRealized) {
            return;
        }
        
        var trough = this.XamlFind ("Trough");

        trough.AddEventListener ("mouseleftbuttondown", delegate (this, function (o, args) {
            if (this.SliderEnabled) {
                var pos = args.GetPosition (o)
                this.OnMouseDown (pos.X, pos.Y);
            }
        }));
        
        trough.AddEventListener ("mouseleftbuttonup", delegate (this, function (o, args) {
            if (this.SliderEnabled) {
                var pos = args.GetPosition (o);
                this.Value = pos.X / o.Width;
                this.OnMouseUp (pos.X, pos.Y);
            }
        }));
        
        var slider = this.XamlFind ("Slider");
        
        slider.AddEventListener ("mouseleave", delegate (this, function (o, args) {
            this.is_slider_prelit = false;
            this.OnDragEnd ();
            this.StyleSlider ();
        }));
        
        slider.AddEventListener ("mouseenter", delegate (this, function (o, args) {
            if (this.SliderEnabled) {
                this.is_slider_prelit = true;
                this.StyleSlider ();
            }
        }));
        
        slider.AddEventListener ("mousemove", delegate (this, function (o, args) {
            if (!this.IsDragging) {
                return;
            }
            
            var trough = this.XamlFind ("Trough");
            var tr_l = trough["Canvas.Left"];
            var tr_w = trough.Width;
            var sl_l = o["Canvas.Left"];
            var sl_w = o.Width;
            
            var nx = args.GetPosition (o).X - this.slider_press_x;
            var dx = sl_l + nx;
            
            if (dx < tr_l) {
                sl_l = tr_l;
            } else if (dx > tr_l + tr_w - sl_w) {
                sl_l = tr_l + tr_w - sl_w;
            } else {
                sl_l += nx;
            }
            
            this.Value = (sl_l - tr_l) / (tr_w - sl_w);
        }));
        
        slider.AddEventListener ("mouseleftbuttondown", delegate (this, function (o, args) {
            if (this.SliderEnabled) {
                this.is_slider_prelit = true;
                this.slider_press_x = args.GetPosition (o).X;
                this.OnDragBegin ();
                this.StyleSlider ();
            }
        }));

        slider.AddEventListener ("mouseleftbuttonup", delegate (this, function (o, args) {
            var pos = args.GetPosition (o);
            this.is_slider_prelit = this.SliderEnabled && pos.X >= 0 && pos.Y >= 0 && 
                pos.X <= o.Width && pos.Y <= o.Height;
            this.OnDragEnd ();
            this.StyleSlider ();
        }));
        
        this.ForeachXamlChild ("Trough", false, function (elem) elem.Clip = this.CreateXaml ("<RectangleGeometry/>"));
    });
    
    //
    // Style
    //

    this.style_set = false;

    this.Override ("OnStyleSet", function () {
        this.style_set = true;
        
        this.normal_slider_fill_brush = MtkStyle.CreateGradient (this, "button_bg");
        this.normal_slider_stroke_brush = MtkStyle.CreateGradient (this, "button_shadow");
        this.normal_pill_fill_brush = MtkStyle.CreateGradient (this, "button_shadow", true);
        
        this.prelit_slider_fill_brush = MtkStyle.CreateGradient (this, "button_bg");
        this.prelit_slider_stroke_brush = MtkStyle.CreateGradient (this, "highlight_bg", 
            false, ["darker", "darkest"], [0, 1]);
        this.prelit_pill_fill_brush = MtkStyle.CreateGradient (this, "highlight_bg", true);
        
        this.pressed_slider_fill_brush = MtkStyle.CreateGradient (this, "button_bg", true);
        this.pressed_pill_fill_brush = MtkStyle.CreateGradient (this, "highlight_bg");
        
        this.progress_fill_brush = MtkStyle.CreateGradient (this, "highlight_bg", true);
        
        this.StyleSlider ();
        
        var trough = this.XamlFind ("Trough");
        trough.Children.GetItem (0).Fill = MtkStyle.CreateGradient (this, "trough_bg", true);
        trough.Children.GetItem (1).Stroke = MtkStyle.GetColor ("button_shadow");
        
        trough.Children.GetItem (2).Fill = MtkStyle.CreateGradient (this, "highlight_bg", true);
        trough.Children.GetItem (3).Stroke = MtkStyle.GetColor ("highlight_bg", "darkest");
    });
    
    this.StyleSlider = function () {
        var slider = this.XamlFind ("Slider");
        if (!slider || !this.style_set) {
            return;
        }
        
        if (this.IsDragging) {
            slider.Children.GetItem (0).Fill = this.pressed_slider_fill_brush;
            slider.Children.GetItem (1).Fill = this.pressed_pill_fill_brush;
        } else if (this.is_slider_prelit) {
            slider.Children.GetItem (0).Fill = this.prelit_slider_fill_brush;
            slider.Children.GetItem (1).Fill = this.prelit_pill_fill_brush;
        } else {
            slider.Children.GetItem (0).Fill = this.normal_slider_fill_brush;
            slider.Children.GetItem (1).Fill = this.normal_pill_fill_brush;
            slider.Children.GetItem (2).Stroke = this.normal_slider_stroke_brush;
        }
        
        if (this.IsDragging || this.is_slider_prelit) {
            slider.Children.GetItem (2).Stroke = this.prelit_slider_stroke_brush;
        }
    };

    //
    // Size Allocation/Layout
    //
    
    this.__defineGetter__ ("TroughWidth", function () this.XamlFind ("Trough").Width);
    this.__defineGetter__ ("SliderVisibleWidth", function () {
        var slider = this.XamlFind ("Slider");
        return slider.Visibility == "Visible" ? slider.Width : 0;
    });
    
    this.__defineGetter__ ("SliderVisible", function () this.XamlFind ("Slider").Visibility == "Visible");
    this.__defineSetter__ ("SliderVisible", function (x) {
        this.XamlFind ("Slider").Visibility = x ? "Visible" : "Collapsed";
        this.OnDragEnd ();
        this.OnSizeAllocate ();
    });
    
    this.slider_enabled = true;
    this.__defineGetter__ ("SliderEnabled", function () this.slider_enabled);
    this.__defineSetter__ ("SliderEnabled", function (x) {
        if (this.slider_enabled == x) {
            return;
        }
        
        this.slider_enabled = x;
        this.OnDragEnd ();
        this.StyleSlider ();
    });

    this._slider_top = 0;

    this.Override ("OnSizeRequest", function () {
        var request = {};
        request.Width = 2 * this.XPad + Math.max (this.MinWidth, this.SliderWidth);
        request.Height = 2 * this.YPad + Math.max (this.TroughHeight, this.SliderHeight);
        return request;
    });

    this.Override ("OnSizeAllocate", function () {
        if (!this.IsRealized) {
            return;
        }

        this.$OnSizeAllocate$ ();
        
        var width = this.Allocation.Width;
        var trough_left = this.XPad;
        var trough_top = this.YPad + Math.round ((this.Allocation.Height - 
            this.TroughHeight - 2 * this.YPad) / 2);
        this._slider_top = this.YPad + Math.round ((this.Allocation.Height - 
            this.SliderHeight - 2 * this.YPad) / 2);

        this.ForeachXamlChild ("Trough", true, function (elem, index) {
            elem.Width = this.Allocation.Width - 2 * this.XPad;
            elem.Height = this.TroughHeight;
            if (index < 0) {
                elem["Canvas.Left"] = trough_left;
                elem["Canvas.Top"] = trough_top;
            } else {
                elem.RadiusX = this.TroughRadius;
                elem.RadiusY = this.TroughRadius;
                if (!elem.Clip) {
                    elem.Clip = this.CreateXaml ("<RectangleGeometry/>");
                }
            }
        });

        this.ForeachXamlChild ("Slider", true, function (elem, index) {
            if (index == 1) {
                elem.Clip =
                    " M 0,0 " + 
                    " L 0," + this.SliderHeight + 
                    " L " + this.PillWidth + "," + this.SliderHeight + 
                    " L " + this.PillWidth + ",0 " +
                    " L 0,0 Z " +
                    " M " + (this.SliderWidth - this.PillWidth) + ",0 " + 
                    " L " + (this.SliderWidth - this.PillWidth) + "," + this.SliderHeight + 
                    " L " + this.SliderWidth + "," + this.SliderHeight + 
                    " L " + this.SliderWidth + ",0 " + 
                    " L " + (this.SliderWidth - this.PillWidth) + ",0 Z";
                elem.RadiusX = this.SliderRadius + 1;
                elem.RadiusY = this.SliderRadius + 1;
            } else if (index >= 0) {
                elem.RadiusX = this.SliderRadius;
                elem.RadiusY = this.SliderRadius;
            }
            
            if (index == 3) {
                elem["Canvas.Top"] = 1;
                elem["Canvas.Left"] = 1;
                elem.Width = this.SliderWidth - 2;
                elem.Height = this.SliderHeight - 2;
            } else {
                elem.Width = this.SliderWidth;
                elem.Height = this.SliderHeight;
            }
        });
        
        this.PositionSlider ();
    });

    this.PositionSlider = function () {
        if (!this.IsRealized) {
            return;
        }
    
        var slider = this.XamlFind ("Slider");
        var trough = this.XamlFind ("Trough");
        
        if (!slider || !trough) {
            return;
        }
        
        slider["Canvas.Top"] = this._slider_top;
        slider["Canvas.Left"] = trough["Canvas.Left"] 
            + (trough.Width - this.SliderVisibleWidth) * this.Value;
        
        var t_clip = slider["Canvas.Left"] - trough["Canvas.Left"] 
            + Math.round (this.SliderVisibleWidth / 2);
        
        for (var i = 0; i < trough.Children.Count; i++) {
            var elem = trough.Children.GetItem (i);
            var clip = i < 2
                ? t_clip + ",0," + trough.Width
                : "0,0," + t_clip;
            elem.Clip.Rect = clip + "," + trough.Height;
        }
    };

    this.AfterConstructed ();
}
