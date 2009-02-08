function __MoonshineBindInstance (control) {
    MtkContext.SilverlightOnLoad (control);
    new MoonshinePlayer;
}

function MoonshinePlayer () {
    MtkWindow.call (this);

    this.Container = new MtkVBox;
    this.MediaElement = new MtkMediaElement;
    this.Controls = new MoonshineControlBar;

    this.Container.PackStart (this.MediaElement, true);
    this.Container.PackStart (this.Controls);
    this.Add (this.Container);

    this.Background = "black";

    this.Controls.FullScreenButton.AddEventListener ("activated",
        delegate (this, this.ToggleFullScreen));

    this.AfterConstructed ();
}

function MoonshineControlBar () {
    MtkToolBar.call (this);
    var self = this;

    this.Spacing = 8;
    this.Padding = 2;

    this.PlayPauseButton = new MoonshinePlayPauseButton;
    this.SeekBar = new MoonshineSeekBar;
    this.VolumeBar = new MoonshineVolumeBar;
    this.FullScreenButton = new MtkButton (new MtkLabel ("Full Screen"));

    this.PackStart (this.PlayPauseButton);
    this.PackStart (new MtkHBox ({
        Spacing: 16,
        With: function () {
            this.PackStart (self.SeekBar, true);
            this.PackStart (self.VolumeBar);
        }
    }), true);
    this.PackStart (this.FullScreenButton);

    this.AfterConstructed ();
}

function MoonshineSeekBar () {
    MtkSlider.call (this);
}

function MoonshineVolumeBar () {
    MtkHBox.call (this);

    this.Spacing = 4;

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
        <Canvas Width="13" Height="12"> \
            <Path Canvas.Top=".5" Canvas.Left=".5" Stroke="#afff" \
                StrokeThickness="1" Data="' + speaker_path + '"/> \
            <Path Data="' + speaker_path + '"> \
                <Path.Fill> \
                    <LinearGradientBrush StartPoint="0,0" EndPoint="0,1"> \
                        <GradientStop Offset="0.0" Color="#999"/> \
                        <GradientStop Offset="0.45" Color="#777"/> \
                        <GradientStop Offset="0.45" Color="#666"/> \
                        <GradientStop Offset="1.0" Color="#333"/> \
                    </LinearGradientBrush> \
                </Path.Fill> \
            </Path> \
            <Path Canvas.Left="1" Data="' + sound_wave_path + '" Fill="#666"/> \
        </Canvas> \
    ');

    this.Slider = new MtkSlider;
    this.Slider.MinWidth = 60;
    this.Slider.PillWidth = 3;
    this.Slider.TroughHeight = 3;
    this.Slider.TroughRadius = 2;
    this.Slider.SliderWidth = 14;
    this.Slider.SliderHeight = 7;
    this.Slider.SliderRadius = 3;

    this.PackStart (this.Icon);
    this.PackStart (this.Slider);
}

function MoonshinePlayPauseButton (settings) {
    MtkButton.call (this, settings);

    this.Icon = new MtkXaml ('\
        <Canvas Name="PlayPauseIcons" Width="16" Height="16"> \
          <Canvas Name="PlayIcon" Width="14" Height="16" Opacity="1" Canvas.Left="1"> \
            <Path Stroke="#26000000" StrokeThickness="1.99999774" StrokeMiterLimit="4" StrokeDashOffset="0" StrokeLineJoin="Round" StrokeEndLineCap="Square" Data="M 0.999999 14.999913 L 0.999999 0.99999339 L 12.999799 7.8012334 L 0.999999 14.999913 z"/> \
            <Path Fill="#FFD3D7CF" StrokeThickness="1.00000036" StrokeMiterLimit="4" StrokeDashOffset="0" StrokeLineJoin="Round" StrokeEndLineCap="Square" Data="M 1.229899 14.224863 L 1.229899 1.4590134 L 12.324439 7.8419334 L 1.229899 14.224863 z"/> \
            <Path Stroke="#FF464744" StrokeThickness="1.00000012" StrokeMiterLimit="4" StrokeDashOffset="0" StrokeLineJoin="Round" StrokeEndLineCap="Square" Data="M 1.229899 14.224863 L 1.229899 1.4590134 L 12.324439 7.8419334 L 1.229899 14.224863 z"/> \
            <Path Fill="#FFFFFFFF" StrokeThickness="3" StrokeMiterLimit="4" StrokeDashOffset="0" StrokeLineJoin="Miter" StrokeEndLineCap="Square" Data="M 1.460049 1.8604134 L 1.460049 13.823453 L 11.859759 7.8419334 L 1.460049 1.8604134 z M 1.920339 2.6636834 L 10.924789 7.8419334 L 1.920339 13.020173 L 1.920339 2.6636834 z"/> \
            <Path Fill="#80FFFFFF" StrokeThickness="2" StrokeMiterLimit="10" StrokeDashOffset="0" StrokeLineJoin="Round" StrokeEndLineCap="Round" Data="M 1.891819 2.6352334 L 1.891819 7.9999534 C 3.856899 7.9793934 6.110009 7.8413334 9.745539 7.1393034 L 1.891819 2.6352334 z"/> \
            <Canvas.Resources> \
              <Storyboard Name="PlayIconStoryboard"  \
                Storyboard.TargetProperty="Opacity"  \
                Storyboard.TargetName="PlayIcon"> \
                <DoubleAnimation Name="PlayIconAnimation" Duration="0:0:0.25"/> \
              </Storyboard> \
            </Canvas.Resources> \
          </Canvas> \
          <Canvas Name="PauseIcon" Width="16" Height="16" Opacity="0"> \
            <Path Stroke="#26000000" StrokeThickness="1.99999952000000003" StrokeMiterLimit="4" StrokeDashOffset="0" StrokeLineJoin="Round" StrokeEndLineCap="Square" Data="M 9.28215 1.0034651 L 9.28215 14.931205 L 14.6887 14.931205 L 14.6887 1.0034651 L 9.28215 1.0034651 z"/> \
            <Path Fill="#FFCDD1C8" StrokeThickness="1" StrokeMiterLimit="4" StrokeDashOffset="0" StrokeLineJoin="Miter" StrokeEndLineCap="Square" Data="M 9.53515 1.3660051 L 9.53515 14.568705 L 14.43568 14.568705 L 14.43568 1.3660051 L 9.53515 1.3660051 z"/> \
            <Path Stroke="#FF626460" StrokeThickness="1.00000024000000010" StrokeMiterLimit="4" StrokeDashOffset="0" StrokeLineJoin="Round" StrokeEndLineCap="Square" Data="M 9.5351497 1.3673851 L 9.5351497 14.627965 L 14.43568 14.627965 L 14.43568 1.3673851 L 9.5351497 1.3673851 z"/> \
            <Path Stroke="#96FFFFFF" StrokeThickness="0.99999963999999997" StrokeMiterLimit="4" StrokeDashOffset="0" StrokeLineJoin="Miter" StrokeEndLineCap="Square" Data="M 10.14772 1.994705 L 10.14772 13.940005 L 13.82311 13.940005 L 13.82311 1.994705 L 10.14772 1.994705 z"/> \
            <Path Fill="#FFF7F7F7" StrokeThickness="2" StrokeMiterLimit="10" StrokeDashOffset="0" StrokeLineJoin="Round" StrokeEndLineCap="Round" Data="M 10.46595 2.332325 L 10.46595 7.604375 L 13.52507 7.215385 L 13.52507 2.276755 L 10.46595 2.332325 z"/> \
            <Path Stroke="#26000000" StrokeThickness="1.99999940000000009" StrokeMiterLimit="4" StrokeDashOffset="0" StrokeLineJoin="Round" StrokeEndLineCap="Square" Data="M 0.9999997 0.99999508 L 0.9999997 14.934705 L 6.4095197 14.934705 L 6.4095197 0.99999508 L 0.9999997 0.99999508 z"/> \
            <Path Fill="#FFCDD1C8" StrokeThickness="1" StrokeMiterLimit="4" StrokeDashOffset="0" StrokeLineJoin="Miter" StrokeEndLineCap="Square" Data="M 1.25315 1.3627251 L 1.25315 14.572035 L 6.15636 14.572035 L 6.15636 1.3627251 L 1.25315 1.3627251 z"/> \
            <Path Stroke="#FF626460" StrokeThickness="1.00000011999999994" StrokeMiterLimit="4" StrokeDashOffset="0" StrokeLineJoin="Round" StrokeEndLineCap="Square" Data="M 1.2531497 1.3641051 L 1.2531497 14.631315 L 6.1563597 14.631315 L 6.1563597 1.3641051 L 1.2531497 1.3641051 z"/> \
            <Path Stroke="#96FFFFFF" StrokeThickness="0.99999963999999997" StrokeMiterLimit="4" StrokeDashOffset="0" StrokeLineJoin="Miter" StrokeEndLineCap="Square" Data="M 1.8660497 1.9917351 L 1.8660497 13.943005 L 5.5434597 13.943005 L 5.5434597 1.9917351 L 1.8660497 1.9917351 z"/> \
            <Path Fill="#FFF7F7F7" StrokeThickness="2" StrokeMiterLimit="10" StrokeDashOffset="0" StrokeLineJoin="Round" StrokeEndLineCap="Round" Data="M 2.18446 2.329525 L 2.18446 8.660565 L 5.24525 8.271385 L 5.24525 2.273935 L 2.18446 2.329525 z"/> \
            <Canvas.Resources> \
              <Storyboard Name="PauseIconStoryboard"  \
                Storyboard.TargetProperty="Opacity"  \
                Storyboard.TargetName="PauseIcon"> \
                <DoubleAnimation Name="PauseIconAnimation" Duration="0:0:0.25"/> \
              </Storyboard> \
            </Canvas.Resources> \
          </Canvas> \
        </Canvas> \
    ', this.XamlHost);

    this.Add (this.Icon);

    this.Override ("OnActivated", function () {
        this.$OnActivated$ ();
    });

    this.AfterConstructed ();
}

