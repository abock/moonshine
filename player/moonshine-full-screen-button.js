function MoonshineFullScreenButton () {
    MtkButton.call (this);
    
    this.Override ("OnRealize", function () {
        this.$OnRealize$ ();
        if (!this.IsRealized) {
            return;
        }
        
        this.Icon = new MtkXaml ('\
            <Canvas Width="16" Height="16"> \
                <Path Width="14" Height="14" Canvas.Left="1" Canvas.Top="1" Opacity="1" Data=" \
                    M6,0 L0,0 L0,6 Z \
                    M0,8 L0,14 L6,14 Z \
                    M8,14 L14,14 L14,8 Z \
                    M14,6 L14,0 L8,0 Z \
                "/> \
                <Path Width="14" Height="14" Canvas.Left="1" Canvas.Top="1" Opacity="0" Data=" \
                    M6,6 L6,0 L0,6 Z \
                    M6,8 L6,14 L0,8 Z \
                    M8,8 L8,14 L14,8 Z \
                    M8,0 L8,6 L14,6 Z \
                "/> \
            </Canvas> \
        ');
    
        var fill = MtkStyle.CreateLinearGradient (this, [ 0, 0.5, 0.5, 1], [
            MtkColor.SetOpacity (MtkStyle.Colors.button_fg.normal, 0xaa),
            MtkColor.SetOpacity (MtkStyle.Colors.button_fg.normal, 0xcc),
            MtkColor.SetOpacity (MtkStyle.Colors.button_fg.normal, 0xdd),
            MtkColor.SetOpacity (MtkStyle.Colors.button_fg.normal, 0xf0)
        ]);
        
        for (i = 0; i < 2; i++) {
            this.Icon.Xaml.Children.GetItem (i).Fill = fill;
        }
        
        this.Screen.AddEventListener ("ToggleFullScreen", delegate (this, function (o, fs) {
            this.Icon.Xaml.Children.GetItem (0).Opacity = fs ? 0 : 1;
            this.Icon.Xaml.Children.GetItem (1).Opacity = fs ? 1 : 0;
        }));
        
        this.Add (this.Icon);
    });
    
    this.Override ("OnActivated", function () this.Screen.ToggleFullScreen ());
    
    this.AfterConstructed ();
}

