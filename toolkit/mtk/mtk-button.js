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

    //
    // State
    //

    this.IsPressed = false;

    //
    // Button UI and Interaction
    //

    this.normal_fill_brush = null;
    this.pressed_fill_brush = null;
    this.stroke_brush = null;

    this.InitFromXaml ('\
        <Canvas Name="' + this.Name + '"> \
            <Canvas Name="' + this.Name + 'Style"> \
                <Rectangle RadiusX="3" RadiusY="3" Name="' + this.Name + 'Fill"/> \
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

            this.StyleButton ();
        }));
        
        this.Xaml.AddEventListener ("mouseleave", delegate (this, function (o, args) {
            this.Animate ([this.XamlFind ("StyleAnimation")], this.RestOpacity);
            var storyboard = this.XamlFind ("Storyboard");
            if (storyboard) {
                storyboard.Begin ();
            }

            this.IsPressed = false;
            this.StyleButton ();
        }));

        this.Xaml.AddEventListener ("mouseleftbuttondown", delegate (this, function (o, args) {
            this.IsPressed = true;
            this.StyleButton ();
        }));

        this.Xaml.AddEventListener ("mouseleftbuttonup", delegate (this, function (o, args) {
            this.IsPressed = false;
            this.StyleButton ();
            this.OnActivated ();
        }));

        this.XamlFind ("Style").Opacity = this.RestOpacity;
        this.StyleButton ();

        if (init_child) {
            this.Add (init_child);
        }
    });
    
    this.Override ("OnStyleSet", function () {
        if (!this.normal_fill_brush) {
            this.normal_fill_brush = MtkStyle.CreateGradient (this, "button_bg");
        }

        if (!this.pressed_fill_brush) {
            this.pressed_fill_brush = MtkStyle.CreateGradient (this, "button_bg", true);
        }
        
        if (!this.stroke_brush) {
            this.stroke_brush = MtkStyle.CreateGradient (this, "button_shadow");
        }
    });

    this.StyleButton = function () {
        var fill = this.XamlFind ("Fill");
        if (!fill) {
            return;
        }
        
        fill.Fill = this.IsPressed 
            ? this.pressed_fill_brush 
            : this.normal_fill_brush;
        fill.Stroke = this.stroke_brush;
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

