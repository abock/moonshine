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
    this.SliderWidth = 20;
    this.SliderHeight = 10;
    this.SliderRadius = 4;
    this.MinWidth = 100;

    this.value = 0.0;
    this.__defineGetter__ ("Value", function () this.value);
    this.__defineSetter__ ("Value", function (x) {
        if (x < 0 || x > 1) {
            MtkConsole.Log ("Invalid MtkSlider.Value: " + x);
            x = x < 0 ? 0 : 1;
        }
        this.value = x;
        this.PositionSlider ();
    });

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
    
    this.IsPrelit = false;
    this.IsPressed = false;
    
    this.Override ("OnRealize", function () {
        this.$OnRealize$ ();
        if (!this.IsRealized) {
            return;
        }
        
        var slider = this.XamlFind ("Slider");
        
        slider.AddEventListener ("mouseleave", delegate (this, function (o, args) {
            this.IsPrelit = false;
            this.IsPressed = false;
            this.StyleSlider ();
        }));
        
        slider.AddEventListener ("mouseenter", delegate (this, function (o, args) {
            this.IsPrelit = true;
            this.StyleSlider ();
        }));
        
        slider.AddEventListener ("mouseleftbuttondown", delegate (this, function (o, args) {
            this.IsPrelit = true;
            this.IsPressed = true;
            this.StyleSlider ();
        }));

        slider.AddEventListener ("mouseleftbuttonup", delegate (this, function (o, args) {
            this.IsPressed = false;
            this.StyleSlider ();
        }));
    });

    this.Override ("OnStyleSet", function () {
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
        
        if (this.IsPressed) {
            slider.Children.GetItem (0).Fill = this.pressed_slider_fill_brush;
            slider.Children.GetItem (1).Fill = this.pressed_pill_fill_brush;
        } else if (this.IsPrelit) {
            slider.Children.GetItem (0).Fill = this.prelit_slider_fill_brush;
            slider.Children.GetItem (1).Fill = this.prelit_pill_fill_brush;
        } else {
            slider.Children.GetItem (0).Fill = this.normal_slider_fill_brush;
            slider.Children.GetItem (1).Fill = this.normal_pill_fill_brush;
            slider.Children.GetItem (2).Stroke = this.normal_slider_stroke_brush;
        }
        
        if (this.IsPressed || this.IsPrelit) {
            slider.Children.GetItem (2).Stroke = this.prelit_slider_stroke_brush;
        }
    };

    //
    // Size Allocation/Layout
    //

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
        var slider = this.XamlFind ("Slider");
        var trough = this.XamlFind ("Trough");
    
        var t_clip = this.XPad + (trough.Width - slider.Width) * this.Value
    
        slider["Canvas.Top"] = this._slider_top;
        slider["Canvas.Left"] = t_clip;
        
        t_clip += Math.round (slider.Width / 2);
        
        for (var i = 0; i < trough.Children.Count; i++) {
            var elem = trough.Children.GetItem (i);
            var clip = i < 2
                ? t_clip + ",0," + trough.Width
                : "0,0," + t_clip;
            elem.Clip.Rect = clip + "," + trough.Height;
        }
    };

    // 
    // Interaction
    //

    this.Virtual ("OnValueChanged", function () this.RaiseEvent ("valuechanged", this.Value));

    this.AfterConstructed ();
}
