function MtkSlider (settings) {
    MtkWidget.call (this, settings);
   
    //
    // Properties
    //

    this.XPad = 0;
    this.YPad = 0;
    this.TroughHeight = 6;
    this.TroughRadius = 3;
    this.SliderWidth = 16;
    this.SliderHeight = 10;
    this.SliderRadius = 3;
    this.MinWidth = 100;

    this.value = 0;
    this.__defineGetter__ ("Value", function () this.value);
    this.__defineSetter__ ("Value", function (x) {
        this.value = x;
        this.PositionSlider ();
    });

    this.InitFromXaml ('<Canvas> \
        <Canvas Name="' + this.Name + 'Trough"> \
        <Rectangle> \
            <Rectangle.Fill> \
                <LinearGradientBrush StartPoint="0,0" EndPoint="0,1"> \
                    <GradientStop Offset="0.0" Color="#f000"/> \
                    <GradientStop Offset="0.4" Color="#f222"/> \
                    <GradientStop Offset="1.0" Color="#f333"/> \
                </LinearGradientBrush> \
            </Rectangle.Fill> \
        </Rectangle> \
        <Rectangle Name="' + this.Name + 'Progress"> \
            <Rectangle.Clip> \
                <RectangleGeometry Rect=""/> \
            </Rectangle.Clip> \
            <Rectangle.Fill> \
                <LinearGradientBrush StartPoint="0,0" EndPoint="0,1"> \
                    <GradientStop Offset="0.0" Color="#ff336503"/> \
                    <GradientStop Offset="0.5" Color="#ff4e9a06"/> \
                    <GradientStop Offset="1.0" Color="#ff73d216"/> \
                </LinearGradientBrush> \
            </Rectangle.Fill> \
        </Rectangle> \
        <Rectangle Stroke="#5fff"/> \
        </Canvas> \
        <Canvas Name="' + this.Name + 'Slider"> \
            <Rectangle Fill="purple"/> \
        </Canvas> \
    </Canvas>');

    this.Override ("OnRealize", function () {
        this.$OnRealize$ ();
        if (!this.IsRealized) {
            return;
        }

        var slider = this.XamlFind ("Slider");
        slider.Cursor = "Hand";
    });

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
            }
        });

        this.PositionSlider ();
    });

    this.PositionSlider = function () {
        var slider_left = this.XPad;

        this.ForeachXamlChild ("Slider", true, function (elem, index) {
            elem.Width = this.SliderWidth;
            elem.Height = this.SliderHeight;
            if (index < 0) {
                elem["Canvas.Top"] = this._slider_top;
                elem["Canvas.Left"] = slider_left;
            } else {
                elem.RadiusX = this.SliderRadius;
                elem.RadiusY = this.SliderRadius;
            }
        });
    };

    // 
    // Interaction
    //

    this.Virtual ("OnValueChanged", function () this.RaiseEvent ("valuechanged", this.Value));

    this.AfterConstructed ();
}

          /*<Rectangle.Resources> \
            <Storyboard Name="SeekSliderPlayedStoryboard" \ 
              Storyboard.TargetProperty="Width" \
              Storyboard.TargetName="SeekSliderPlayed"> \
              <DoubleAnimation Name="SeekSliderPlayedAnimation" Duration="0:0:0.5"/> \
            </Storyboard> \
          </Rectangle.Resources> \ */

