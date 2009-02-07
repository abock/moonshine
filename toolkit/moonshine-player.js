function __MoonshineBindInstance (control) {
    MtkContext.SilverlightOnLoad (control);

    new MtkWindow (function () {
        this.Add (new MtkVBox (function () {
            this.PackStart (new MtkMediaElement, true);
            this.PackStart (new MtkControlBar (function () {
                this.PackStart (new MtkPlayPauseButton ({
                    Events: { "click": function () alert ("OMG!") }
                }));
                this.PackStart (new MtkLabel ({ Text: "Label on the toolbar" }), true);
                this.PackStart (new MtkButton ({
                    With: function () this.Add (new MtkXaml ('<Canvas Width="50" Height="16" Background="purple"/>')),
                    Events: { "click": function (o) o.Parent.Remove (o) }
                }));
                this.PackStart (new MtkButton (new MtkLabel ({ Text: "Click Me!" })));
                this.PackStart (new MtkButton (function () this.Add (new MtkLabel ({ Text: "Another Button" }))));
            }));
        }));
    });
}

function MtkControlBar (settings) {
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

function MtkPlayPauseButton (settings) {
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
    this.AfterConstructed ();
}

