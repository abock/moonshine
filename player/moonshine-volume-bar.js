function MoonshineVolumeBar (media_element) {
    MtkHBox.call (this);

    var speaker_path = '\
        M 6,0 L 3,2.84 L 0,3.5 L 0,7.5 L 3,8.15 L 6,11 L 7,11 L 7,7.93 L  \
        7,3.03 L 7,0 L 6,0 Z \
    ';

    var sound_wave_path = '\
        M 7,3.03 C 7.75,3.26 8.34,4.29 8.34,5.5 C  \
        8.34,6.7 7.75,7.7 7,7.93 C 7.1,7.97 7.22,8 7.34,8 C 8.26,8 8.99,6.88  \
        9,5.5 C 9,4.12 8.26,3 7.34,3 C 7.22,3 7.1,2.99 7,3.03 Z M 8.5,1 C  \
        8.32,1 8.16,1.03 8,1.09 C 9.13,1.51 10,3.32 10,5.5 C 10,7.67  \
        9.13,9.48 8,9.9 C 8.16,9.96 8.32,10 8.5,10 C 9.88,10 10.99,7.98  \
        11,5.5 C 11,3.01 9.87,1 8.5,1 Z \
    ';

    this.Icon = new MtkXaml ('\
        <Canvas Width="13" Height="12" Cursor="Hand"> \
            <Path Canvas.Top=".5" Canvas.Left=".5" Stroke="#afff" \
                StrokeThickness="1" Data="' + speaker_path + '"/> \
            <Path Data="' + speaker_path + '"/> \
            <Path Canvas.Left="1" Data="' + sound_wave_path + '"/> \
            <Canvas Opacity="0" Canvas.Left="4" Canvas.Top="2"> \
                <Rectangle Width="8" Height="8" Fill="#c00" Stroke="#a00" RadiusX="1" RadiusY="1"/> \
                <Rectangle Width="6" Height="6" Canvas.Left="1" Canvas.Top="1" Stroke="#5fff" /> \
                <Line X1="2" Y1="2" X2="6" Y2="6" Stroke="#fff" StrokeThickness="1.5"/> \
                <Line X1="6" Y1="2" X2="2" Y2="6" Stroke="#fff" StrokeThickness="1.5"/> \
            </Canvas> \
        </Canvas> \
    ');
    
    var fill = MtkStyle.CreateLinearGradient (this, [ 0, 0.45, 0.45, 1], [
        MtkColor.SetOpacity (MtkStyle.Colors.button_fg.normal, 0xaa),
        MtkColor.SetOpacity (MtkStyle.Colors.button_fg.normal, 0xcc),
        MtkColor.SetOpacity (MtkStyle.Colors.button_fg.normal, 0xdd),
        MtkColor.SetOpacity (MtkStyle.Colors.button_fg.normal, 0xf0)
    ]);
    
    for (var i = 1; i < 3; i++) {
        this.Icon.Xaml.Children.GetItem (i).Fill = fill;
    }
    
    this.MuteIcon = this.Icon.Xaml.Children.GetItem (3);
    
    this.MuteIcon.AddEventListener ("mouseleftbuttonup", delegate (this, function () {
        media_element.Volume = media_element.Volume > 0 ? 0 : this.Slider.Value;
        this.OnMuteChanged ();
    }));
    
    this.Virtual ("OnMuteChanged", function () {
        this.MuteIcon.Opacity = media_element.Volume <= 0 ? 1 : 0;
        this.RaiseEvent ("MuteChanged");
    });
    
    this.Icon.YPad = 1;

    this.Slider = new MtkSlider;
    this.Slider.MinWidth = 55;
    this.Slider.PillWidth = 3;
    this.Slider.TroughHeight = 4;
    this.Slider.TroughRadius = 2;
    this.Slider.SliderWidth = 14;
    this.Slider.SliderHeight = 8;
    this.Slider.SliderRadius = 3;

    this.Spacing = 2;
    this.PackStart (this.Icon);
    this.PackStart (this.Slider);
    
    this.Slider.Value = media_element.Volume;
    this.Slider.AddEventListener ("ValueChanged", delegate (this, function (o, value) {
        media_element.Volume = value;
        this.OnMuteChanged ();
    }));
}

