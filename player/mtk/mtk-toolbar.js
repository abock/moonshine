function MtkToolBar (settings) {
    this.XamlInitSource = '<Canvas/>';
    MtkHBox.call (this, settings);

    this.Spacing = 3;
    this.Padding = 3;

    this.Override ("OnStyleSet", function () {
        this.Xaml.Background = MtkStyle.CreateGradient (this, "window_bg");
    });

    this.AfterConstructed ();
}

