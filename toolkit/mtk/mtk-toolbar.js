function MtkToolBar (settings) {
    this.XamlInitSource = '\
        <Canvas> \
            <Canvas.Background> \
                <LinearGradientBrush StartPoint="0,0" EndPoint="0,1"> \
                    <GradientStop Offset="0.0" Color="#f7f7f7"/> \
                    <GradientStop Offset="0.5" Color="#e6e6e6"/> \
                    <GradientStop Offset="0.5" Color="#ddd"/> \
                    <GradientStop Offset="1.0" Color="#999"/> \
                </LinearGradientBrush> \
            </Canvas.Background> \
        </Canvas> \
    ';

    MtkHBox.call (this, settings);

    this.Spacing = 3;
    this.Padding = 3;

    this.AfterConstructed ();
}

