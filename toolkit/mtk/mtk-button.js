function MtkButton (settings) {

    // We accept a widget here which we will .Add 
    // later, so save it and call the base ctor 
    var init_child = null;
    if (MtkContext.IsWidget (settings)) {
        MtkContainer.call (this);
        init_child = settings;
    } else {
        MtkContainer.call (this, settings);
    }

    // 
    // Properties
    //

    this.RestOpacity = 0.4;
    this.FocusOpacity = 1.0;
    this.InnerPadding = 5;

    this.FillOffsets = [ 0.0, 0.5, 0.5, 1.0 ];
    this.FillColors = [ "#e8e8e8", "#e0e0e0", "#d8d8d8", "#cdcdcd" ];
    this.LightFillColors = [ "#e1e1e1", "#ececec", "#f4f4f4", "#f0f0f0" ];

    //
    // State
    //

    this.IsPressed = false;

    //
    // Button UI and Interaction
    //

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
                    <DoubleAnimation Name="' + this.Name + 'StyleAnimation" \
                        Storyboard.TargetName="' + this.Name + 'Style" Duration="0:0:0.2"/> \
                    </Storyboard> \
            </Canvas.Resources> \
        </Canvas> \
    ');

    this.Override ("OnRealize", function () {
        this.$OnRealize$ ();
        if (!this.IsRealized) {
            return;
        }
        
        this.Xaml.AddEventListener ("mouseenter", delegate (this, function (o, args) {
            this.Animate ([this.XamlFind ("StyleAnimation")], this.FocusOpacity);
            var storyboard = this.XamlFind ("Storyboard");
            if (storyboard) {
                storyboard.Begin ();
            }
        }));
        
        this.Xaml.AddEventListener ("mouseleave", delegate (this, function (o, args) {
            this.Animate ([this.XamlFind ("StyleAnimation")], this.RestOpacity);
            var storyboard = this.XamlFind ("Storyboard");
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
            this.OnActivated ();
        }));

        var fill = this.XamlFind ("Fill").GradientStops;
        for (var i = 0, n = Math.min (this.FillColors.length, this.FillOffsets.length); i < n; i++) {
            var stop = this.CreateXaml ("<GradientStop/>");
            stop.Color = this.FillColors[i];
            stop.Offset = this.FillOffsets[i];
            fill.Add (stop);
        }

        this.XamlFind ("Style").Opacity = this.RestOpacity;
        this.Xaml.Cursor = "Hand";

        if (init_child) {
            this.Add (init_child);
        }
    });

    this.FillButton = function (o, colors) {
        var stops = this.XamlFind ("Fill").GradientStops;
        for (var i = 0, n = Math.min (colors.length, stops.Count); i < n; i++) {
            stops.GetItem (i).Color = colors[i];
        }
    };

    //
    // Virtual Methods/Events
    //

    this.Virtual ("OnActivated", function () this.RaiseEvent ("activated"));

    //
    // Allocation/Layout
    //

    this.Override ("OnSizeAllocate", function () {
        if (!this.IsRealized) {
            return;
        }

        this.$OnSizeAllocate$ ();

        var style = this.XamlFind ("Style");
        var fill = style.Children.GetItem (0);
        var inner_stroke = style.Children.GetItem (1);

        var width = this.Allocation.Width;
        var height = this.Allocation.Height;

        fill.Width = width; fill.height = height;
        inner_stroke.Width = width - 2; inner_stroke.Height = height - 2;
    });

    this.AfterConstructed ();
}

