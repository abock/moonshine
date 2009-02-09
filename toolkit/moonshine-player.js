function __MoonshineBindInstance (control) {
    MtkContext.BindScreen (control);
    var player = new MoonshinePlayer;
    player.Source = "T-90S_3.wmv";
}

function MoonshinePlayer () {
    MtkWindow.call (this);

    //
    // Window
    //
    
    this.Xaml.AddEventListener ("keydown", delegate (this, function (o, args) {
        switch (args.Key) {
            /* F, F11 */ case 35: case 66: this.Screen.SetFullScreen (true); break;
            /* Up     */ case 15: this.Volume += 0.05; break;
            /* Down   */ case 17: this.Volume -= 0.05; break;
            /* Space  */ case 9:  this.TogglePlaying (); break;
        }
        
        this.ShowControls ();
    }));
    
    this.BuildWindow = function () {
        this.Background = "black";
    
        this.MediaElement = new MtkMediaElement;
        this.Container = new MtkVBox;
        
        this.Controls = new MoonshineControlBar (this.MediaElement);
        this.ControlsPopup = new MtkPopup;
        this.ControlsDocked = true;
    
        this.Container.PackStart (this.MediaElement, true);
        this.Add (this.Container);
        
        this.UpdateControlBarDock ();
            
        this.MediaElement.AddEventListener ("CurrentStateChanged", delegate (this, function (o, state) {
            if (state != "Playing") {
                this.ShowControls ();
                this.RemoveHideControlsTimeout (); // keep the controls alive until the user moves
            }
        }));
    };
    
    //
    // Control Bar
    //
    
    this.UpdateControlBarDock = function () {
        if (this.Screen.GetFullScreen ()) {
            this.Container.Remove (this.Controls);
            this.ControlsPopup.Add (this.Controls);
            this.ControlsPopup.WidthRequest = this.Allocation.Width;
            this.ControlsPopup.Position (0, this.Allocation.Height - this.Controls.Allocation.Height);
            this.ControlsDocked = false;
            this.ControlsPopup.Show ();
            this.ShowControls ();
            
            this.fs_query_mouse = true;
            this.CenteredOffset = 0;
        } else {
            this.ControlsPopup.Remove (this.Controls);
            this.ControlsPopup.Hide ();
            this.Container.PackStart (this.Controls);
            this.ControlsDocked = true;
            this.ShowControls ();
            
            this.CenteredOffset = this.Controls.Allocation.Height;
        }
    };
    
    this.Screen.AddEventListener ("FullScreenChanged", delegate (this, function () {
        this.UpdateControlBarDock ();
    }));
    
    this.last_move_x = 0;
    this.last_move_y = 0;
    this.fs_query_mouse = false;
    
    this.Xaml.AddEventListener ("mousemove", delegate (this, function (o, args) {
        if (this.ControlsDocked) {
            return;
        }
        
        var jitter_threshold = 75;
        var x = args.GetPosition (o).X;
        var y = args.GetPosition (o).Y;
        
        if (this.fs_query_mouse) {
            this.last_move_x = x;
            this.last_move_y = y;
            this.fs_query_mouse = false;
        }
        
        if (Math.abs (x - this.last_move_x) > jitter_threshold || 
            Math.abs (y - this.last_move_y) > jitter_threshold) {
            this.ShowControls ();
            this.last_move_x = x;
            this.last_move_y = y;
        }
    }));
    
    this.controls_hide_timeout = null;
    
    this.ShowControls = function () {
        this.RemoveHideControlsTimeout ();
        if (!this.ControlsDocked) {
            this.ControlsPopup.FadeIn ();
            this.controls_hide_timeout = setTimeout (delegate (this, this.HideControls), 4500);
        }
    };
    
    this.HideControls = function () {
        this.RemoveHideControlsTimeout ();
        this.ControlsPopup.FadeOut ();
    };
    
    this.RemoveHideControlsTimeout = function () {
        if (this.controls_hide_timeout) {
            clearTimeout (this.controls_hide_timeout);
            this.controls_hide_timeout = null;
        }
    };
    
    //
    // Public API
    //
    
    this.__defineGetter__ ("Source", function () this.MediaElement.Source);
    this.__defineSetter__ ("Source", function (x) this.MediaElement.Source = x);
    
    this.__defineGetter__ ("Volume", function () this.MediaElement.Volume);
    this.__defineSetter__ ("Volume", function (x) 
        this.Controls.VolumeBar.Slider.Value = MtkColor.Clamp (x, 0, 1));
    
    this.Play = function () this.MediaElement.Play ();
    this.Pause = function () this.MediaElement.Pause ();
    this.Stop = function () this.MediaElement.Stop ();
    this.TogglePlaying = function () this.MediaElement.TogglePlaying ();
    
    //
    // Show->Road
    //
    
    this.BuildWindow ();
    this.AfterConstructed ();
}

function MoonshineControlBar (media_element) {
    MtkToolBar.call (this);

    this.Spacing = 12;
    this.Padding = 2;

    this.PlayPauseButton = new MoonshinePlayPauseButton (media_element);
    this.SeekBar = new MoonshineSeekBar (media_element);
    this.VolumeBar = new MoonshineVolumeBar (media_element);
    this.FullScreenButton = new MoonshineFullScreenButton;

    this.PackStart (this.PlayPauseButton);
    this.PackStart (this.SeekBar, true);
    this.PackStart (this.VolumeBar);
    this.PackStart (this.FullScreenButton);
    
    this.AfterConstructed ();
}

function MoonshineSeekBar (media_element) {
    MtkSlider.call (this);
    
    this.LiveSeekJitterThreshold = 4;
    this.LiveSeekSpeed = 500;
    
    this.media_element = media_element;
    this.is_tick_updating = false;
    this.allowed_to_seek = false;
    this.live_seek_timeout = null;
    this.last_live_seek_value = -100;
    this.mouse_down = false;
    
    this.SliderEnabled = false;
    
    this.Override ("OnRealize", function () {
        this.$OnRealize$ ();
        if (!this.IsRealized) {
            return;
        }
        
        this.media_element.AddEventListener ("PlayTick", delegate (this, this.OnPlayTick));
        this.media_element.AddEventListener ("MediaOpened", delegate (this, function () {
            this.SliderEnabled = this.media_element.CanSeek;
        }));
        this.media_element.AddEventListener ("Idle", delegate (this, function () {
            this.SliderEnabled = false;
            this.Value = 0;
        }));
    });
    
    this.Override ("OnValueChanged", function (value) {
        if (this.allowed_to_seek && !this.is_tick_updating) {
            this.$OnValueChanged$ (value);
            
            if (this.media_element.CanSeek && !this.media_element.IsLive) {
                var position = value * this.media_element.NaturalDuration.Seconds;
                this.media_element.Position = "0:0:" + position;
            }
        }
    });
    
    this.Override ("OnDragBegin", function () {
        this.$OnDragBegin$ ();
        this.live_seek_timeout = setInterval (delegate (this, this.OnLiveSeekTimeout), this.LiveSeekSpeed);
    });
    
    this.Override ("OnDragEnd", function () {
        this.$OnDragEnd$ ();
        clearInterval (this.live_seek_timeout);
        this.live_seek_timeout = null;
        this.allowed_to_seek = true;
        this.OnValueChanged (this.Value);
        this.allowed_to_seek = false;
    });
    
    this.Override ("OnMouseDown", function () {
        this.mouse_down = true;
        this.$OnMouseDown$ ();
    });
    
    this.Override ("OnMouseUp", function () {
        this.$OnMouseUp$ ();
        this.allowed_to_seek = true;
        this.OnValueChanged (this.Value);
        this.allowed_to_seek = false;
        this.mouse_down = false;
    });
    
    this.OnLiveSeekTimeout = function () {
        var jitter_threshold = this.LiveSeekJitterThreshold / this.TroughWidth;
        if (Math.abs (this.Value - this.last_live_seek_value) < jitter_threshold) {
            return;
        }
        
        this.allowed_to_seek = true;
        this.OnValueChanged (this.Value);
        this.last_live_seek_value = this.Value;
        this.allowed_to_seek = false;
    };
    
    this.OnPlayTick = function (o, position, duration, percent, is_live) {
        if (!this.IsDragging && !this.mouse_down) {
            this.is_tick_updating = true;
            this.Value = percent;
            this.is_tick_updating = false;
        }
    };
}

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
    
    for (i = 1; i < 3; i++) {
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

function MoonshinePlayPauseButton (media_element) {
    MtkButton.call (this);

    this.Icon = new MtkXaml ('\
        <Canvas Name="PlayPauseIcons" Width="16" Height="16"> \
          <Canvas Name="PlayIcon" Width="14" Height="16" Opacity="1" Canvas.Left="1.5" Canvas.Top="0.5"> \
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
          <Canvas Name="PauseIcon" Width="16" Height="16" Opacity="0" Canvas.Left="0.15" Canvas.Top="0.5"> \
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
    
    this.play_icon_storyboard = this.Icon.Xaml.FindName ("PlayIconStoryboard");
    this.play_icon_animation = this.Icon.Xaml.FindName ("PlayIconAnimation");
    this.pause_icon_storyboard = this.Icon.Xaml.FindName ("PauseIconStoryboard");
    this.pause_icon_animation = this.Icon.Xaml.FindName ("PauseIconAnimation");
    
    media_element.AddEventListener ("CurrentStateChanged", delegate (this, function (o) {
        var playing = o.IsPlaying;
        this.play_icon_animation.To = playing ? 0 : 1;
        this.pause_icon_animation.To = playing ? 1 : 0;
        this.play_icon_storyboard.Begin ();
        this.pause_icon_storyboard.Begin ();
    }));
    
    this.Override ("OnActivated", function () media_element.TogglePlaying ());

    this.AfterConstructed ();
}

