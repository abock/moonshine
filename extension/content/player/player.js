function delegate (target, callback) {
    return function () { callback.apply (target, arguments); }
}

function __MoonMediaPlayerOnLoad (sender) {
    var player = new __MoonEmbeddedMediaPlayer ();
    player._OnLoad (sender);
}

__MoonEmbeddedMediaPlayer = function () {
}

__MoonEmbeddedMediaPlayer.prototype = {
    control: null,
    xaml: null,
    loaded: false,
    
    percent_complete: 0,
    percent_buffered: 0,

    video_zoom: 1.0,
    video_fit_window: true,
    video_larry_mode: false,
    loop_playback: false,
    max_video_width: 0,
    max_video_height: 0,

    // spacing inside the control bar
    control_spacing: 3,
    control_block_spacing: 6,
    control_seek_spacing: 3,
    
    // spacing/sizing of the bar itself
    control_bar_height: 28,    // how tall
    control_bar_radius: 0,     // how round
    control_bar_spacing: 0,    // how far from edge
    control_bar_docked: false, // does video snap to or slide under the bar
    
    // state for showing/hiding the bar
    control_bar_visible_top: -1,
    control_bar_hidden_top: -1,
    
    _OnLoad: function (sender) {
        this.control = sender.GetHost ();
        
        this._LoadElements (sender);
        this._ConstructInterface ();
        this._ConnectEvents ();
        this._MapAttributes ();
        this._ImplementWmpApi ();
        this.Idle ();

        this.control.Content.OnResize = delegate (this, this._OnResize);
        this.control.Content.OnFullScreenChange = delegate (this, this._OnFullScreenChange);
        this.loaded = true;
    
        if (XULMoonEmbeddedPlayerInit) {
            XULMoonEmbeddedPlayerInit (this);
        }
    },
    
    _LoadElements: function (root) {
        this.xaml = {
            // Controls/UI
            root:                   root,

            background:             root.FindName ("Background"),

            video_element:          root.FindName ("VideoElement"),
            video_window:           root.FindName ("VideoWindow"),
            video_brush:            root.FindName ("VideoBrush"),

            control_bar:            root.FindName ("ControlBar"),
            control_bar_bg:         root.FindName ("ControlBarBackground"),
            left_controls:          root.FindName ("LeftControls"),
            center_controls:        root.FindName ("CenterControls"),
            right_controls:         root.FindName ("RightControls"),

            seek_slider:            root.FindName ("SeekSlider"),
            seek_slider_border:     root.FindName ("SeekSliderBorder"),
            seek_slider_trough:     root.FindName ("SeekSliderTrough"),
            seek_slider_played:     root.FindName ("SeekSliderPlayed"),
            seek_slider_buffered:   root.FindName ("SeekSliderBuffered"),
            seek_slider_downloaded: root.FindName ("SeekSliderDownloaded"),
            position:               root.FindName ("Position"),
            position_text:          root.FindName ("PositionText"),
            
            volume_slider:          root.FindName ("VolumeSlider"),
            volume_slider_trough:   root.FindName ("VolumeSliderTrough"),
            volume_slider_level:    root.FindName ("VolumeSliderLevel"),

            play_button:            this._CreateButton ("PlayButton", "PlayPauseIcons"),
            options_button:         this._CreateButton ("OptionsButton", "FullScreenIcon"),
            
            // Storyboards and Animations
            control_bar_storyboard:        root.FindName ("ControlBarStoryboard"),
            control_bar_animation:         root.FindName ("ControlBarAnimation"),
            seek_slider_played_storyboard: root.FindName ("SeekSliderPlayedStoryboard"),
            seek_slider_played_animation:  root.FindName ("SeekSliderPlayedAnimation"),
        };
        
        this.xaml.play_icon_storyboard  = this.xaml.play_button.FindName ("PlayIconStoryboard");
        this.xaml.play_icon_animation   = this.xaml.play_button.FindName ("PlayIconAnimation");
        this.xaml.pause_icon_storyboard = this.xaml.play_button.FindName ("PauseIconStoryboard");
        this.xaml.pause_icon_animation  = this.xaml.play_button.FindName ("PauseIconAnimation");
        
        this.xaml.open_fs_icon = this.xaml.options_button.FindName ("OpenFullScreenIcon");
        this.xaml.close_fs_icon  = this.xaml.options_button.FindName ("CloseFullScreenIcon");
        
        root.FindName ("ErrorOverlay").Visibility = "Collapsed";
    },

    _ConstructInterface: function () {
        this._ContainerPack (this.xaml.left_controls, this.xaml.play_button);
        this._ContainerPack (this.xaml.right_controls, this.xaml.volume_slider);
        this._ContainerPack (this.xaml.right_controls, this.xaml.options_button, this.control_spacing);
        
        this.xaml.volume_slider_trough["Data"] = this.xaml.volume_slider_level["Data"];
        this._UpdateVolume ();
    },

    _ContainerPack: function (container, child, leading_pad) {
        if (container.Children.Count > 0) {
            var last_child = container.Children.GetItem (container.Children.Count - 1);
            child["Canvas.Left"] = last_child["Canvas.Left"] + last_child.Width + 
                (isNaN (leading_pad) ? 0 : leading_pad);
        } else {
            child["Canvas.Left"] = 0;
        }
        
        this._Reparent (child, container);
    },

    _ContainerAutosize: function (container) {
        var max_width = 0;
        var max_height = 0;

        for (var i = 0, n = container.Children.Count; i < n; i++) {
            var child = container.Children.GetItem (i);
            max_width = Math.max (child["Canvas.Left"] + child.Width, max_width);
            max_height = Math.max (child.Height, max_height);
        }

        container.Width = max_width;
        container.Height = max_height;
    },

    _ConnectEvents: function () {
        this.xaml.root.AddEventListener ("keydown", delegate (this, this._OnKeyDown));
        this.xaml.root.AddEventListener ("mouseenter", delegate (this, this._OnMouseEnter));
        this.xaml.root.AddEventListener ("mouseleave", delegate (this, this._OnMouseLeave));
        this.xaml.root.AddEventListener ("mousemove", delegate (this, this._OnMouseMove));
        this.xaml.root.AddEventListener ("mouseleftbuttonup", delegate (this, this._OnMouseUp));

        this.xaml.play_button.AddEventListener ("mouseleftbuttondown", delegate (this, this._OnPlayPauseClicked));
        this.xaml.options_button.AddEventListener ("mouseleftbuttondown", delegate (this, this._OnOptionsClicked));
        
        this.xaml.volume_slider.AddEventListener ("mouseleftbuttondown", delegate (this, this._OnVolumeMouseDown));

        this.xaml.video_element.AddEventListener ("currentstatechanged", delegate (this, this._OnMediaCurrentStateChanged));
        this.xaml.video_element.AddEventListener ("mediaopened", delegate (this, this._OnMediaOpened));
        this.xaml.video_element.AddEventListener ("mediaended", delegate (this, this._OnMediaEnded));
        this.xaml.video_element.AddEventListener ("downloadprogresschanged", delegate (this, this._OnDownloadProgressChanged));
        this.xaml.video_element.AddEventListener ("bufferingprogresschanged", delegate (this, this._OnBufferingProgressChanged));
    },
    
    _MapAttributes: function () {
        // WMP attributes mapped from <embed> 
        function to_bool (x) {
            return x.toLowerCase () == "true";
        }
        
        var params = this.control.childNodes;
        
        for (var i = 0, n = params.length; i < n; i++) {
            if (!(params[i] instanceof HTMLParamElement)) {
                continue;
            }
            
            value = params[i].value;
            switch (params[i].name.toLowerCase ()) {
                case "bgcolor":      this.xaml.background.Fill = value; break;
                case "showcontrols": this.xaml.control_bar.Visibility = to_bool (value) ? "Visible" : "Collapsed"; break;
                
                case "autostart":    this.xaml.video_element.AutoPlay = to_bool (value); break;
                case "loop":         this.loop_playback = to_bool (value); break;
                
                case "media-source": this.LoadSource (value); break;
            }
        }
    },

    // Layout and Positioning Logic

    _OnResize: function () {
        this.xaml.background.Width = this.control.Content.ActualWidth;
        this.xaml.background.Height = this.control.Content.ActualHeight; 

        // position the main control bar
        this.xaml.control_bar.Height = this.control_bar_height;
        this.xaml.control_bar.Left = this.control_bar_docked ? 0 : this.control_bar_spacing;
        this.control_bar_visible_top = this.xaml.background.Height - this.xaml.control_bar.Height - 
            this.xaml.control_bar.Left;
        this.control_bar_hidden_top = this.xaml.background.Height + this.xaml.control_bar.Height;
        this.xaml.control_bar.Width = this.xaml.background.Width - (2 * this.xaml.control_bar.Left);
        this.xaml.control_bar.Top = this.control_bar_hidden_top;
        
        this.xaml.control_bar_bg.Width = this.xaml.control_bar.Width;
        this.xaml.control_bar_bg.Height = this.xaml.control_bar.Height;
        this.xaml.control_bar_bg.RadiusX = this.control_bar_docked ? 0 : this.control_bar_radius;
        this.xaml.control_bar_bg.RadiusY = this.xaml.control_bar_bg.RadiusX;

        // position the left control group
        this._ContainerAutosize (this.xaml.left_controls);
        this.xaml.left_controls.Left = this.xaml.left_controls.Top = this.control_spacing;

        // position the right control group
        this._ContainerAutosize (this.xaml.right_controls);
        this.xaml.right_controls.Left = this.xaml.background.Width - 
            this.xaml.right_controls.Width - this.control_spacing;
        this.xaml.right_controls.Top = this.control_spacing;

        // position the center control group
        this.xaml.center_controls.Left = this.xaml.left_controls.Left + 
            this.xaml.left_controls.Width + this.control_block_spacing;
        this.xaml.center_controls.Top = this.control_spacing;
        this.xaml.center_controls.Width = this.xaml.control_bar.Width - this.xaml.center_controls.Left - 
            this.xaml.right_controls.Width - (2 * this.control_block_spacing);
        this.xaml.center_controls.Height = this.xaml.left_controls.Height;
        this._PositionSlider (false);

        // calculate video constraints
        this.max_video_width = this.xaml.background.Width;
        this.max_video_height = this.xaml.background.Height;
        if (this.control_bar_docked) {
            this.max_video_height -= this.xaml.control_bar.Height;
        }

        this._PositionVideo ();
        this._OnBufferingProgressChanged (this.xaml.video_element);
        this._OnDownloadProgressChanged (this.xaml.video_element);
    },

    _OnFullScreenChange: function () {
        this._OnResize ();
        this.xaml.open_fs_icon.Opacity = this.control.Content.FullScreen ? 0 : 1;
        this.xaml.close_fs_icon.Opacity = this.control.Content.FullScreen ? 1 : 0;
    },

    _PositionSlider: function (smoothUpdate) {
        // Compute the text box width and round up to the nearest 10 pixels to prevent
        // the slider from jittering if text width changes by a pixel or two
        var t_actual = this.xaml.position_text.ActualWidth;
        var t_width = Math.ceil (t_actual);
        t_width += 10 - t_width % 10;

        this.xaml.position.Width = t_width;
        this.xaml.position.Height = this.xaml.center_controls.Height;

        this.xaml.position_text["Canvas.Left"] = (t_width - t_actual) / 2;
        this.xaml.position_text["Canvas.Top"] = (this.xaml.position.Height - 
            this.xaml.position_text.ActualHeight) / 2;

        this.xaml.seek_slider.Height = this.xaml.center_controls.Height;
        this.xaml.seek_slider.Width = this.xaml.center_controls.Width - this.xaml.position.Width;
        this.xaml.seek_slider_trough.Width = this.xaml.seek_slider_border.Width = this.xaml.seek_slider.Width;

        this.xaml.seek_slider["Canvas.Top"] = (this.xaml.seek_slider.Height - 
            this.xaml.seek_slider_trough.Height) / 2;
            
        this.xaml.position.Left = this.xaml.seek_slider.Width + this.control_seek_spacing;
        
        var played_width = this.xaml.seek_slider_trough.Width * this.percent_complete;
        if (smoothUpdate) {
            // We use a storyboard to update the position bar to smooth the pixels between clock updates
            this.xaml.seek_slider_played_animation.To = played_width;
            this.xaml.seek_slider_played_storyboard.Begin ();
        } else {
            this.xaml.seek_slider_played_storyboard.Stop ();
            this.xaml.seek_slider_played.Width = played_width;
        }
    },

    _PositionVideo: function () {
        var frame_width = this.video_fit_window 
            ? this.max_video_width 
            : this.xaml.video_element.NaturalVideoWidth * this.video_zoom;

        var frame_height = this.video_fit_window 
            ? this.max_video_height 
            : this.xaml.video_element.NaturalVideoHeight * this.video_zoom;

        if (this.video_larry_mode) {
            // this exists just to easily test some fixes Larry is working on; never use
            this.xaml.video_window.Width = this.max_video_width;
            this.xaml.video_window.Height = this.max_video_height;
            this.xaml.video_brush.Stretch = "None"; 
        } else {
            this.xaml.video_window.Width = frame_width > this.max_video_width 
                ? this.max_video_width 
                : frame_width;

            this.xaml.video_window.Height = frame_height > this.max_video_height 
                ? this.max_video_height 
                : frame_height;

            this.xaml.video_window["Canvas.Left"] = (this.max_video_width - this.xaml.video_window.Width) / 2;
            this.xaml.video_window["Canvas.Top"] = (this.max_video_height - this.xaml.video_window.Height) / 2;

            this.xaml.video_brush.Stretch = "Uniform";
        }

        this.xaml.video_window.Visibility = this.xaml.video_element.NaturalVideoWidth > 0 && 
            this.xaml.video_element.NaturalVideoHeight > 0 && frame_width > 0 && frame_height > 0 
            ? "Visible" 
            : "Collapsed";
    },

    // Media/UI Interaction and Control

    LoadSource: function (source) {
        this.Log ("Loading source: " + source);
        this.xaml.video_element.Source = source;
    },
    
    Idle: function () {
        this._UpdatePositionDuration (0, 0, false);
    },

    _UpdatePositionDuration: function (position, duration, smoothUpdate) { 
        var runs = this.xaml.position_text.Inlines.Count;        
        this.xaml.position_text.Inlines.GetItem (0).Text = this._FormatSeconds (position);
        this.xaml.position_text.Inlines.GetItem (runs - 1).Text = this._FormatSeconds (duration);
        this.percent_complete = duration <= 0 ? 0 : position / duration;
        this.percent_buffered = 0;
        this._PositionSlider (smoothUpdate);
    },

    _OnKeyDown: function (o, args) {
        switch (args.Key) {
            /* F, F11 */ case 35: case 66: this.Fullscreen (); break;
            /* Up     */ case 15: this.PlaybackVolume += 0.05; break;
            /* Down   */ case 17: this.PlaybackVolume -= 0.05; break;
            /* Space  */ case 9:  this.TogglePlaying (); break;
        }
        
        this.ShowControls ();
    },

    Fullscreen: function () {
        this.control.Content.FullScreen = true;
    },
    
    _OnMouseEnter: function (o, args) {
        this.ShowControls ();
    },
    
    _OnMouseLeave: function (o, args) {
        this._ClearHideControlsTimeout ();
        this.hide_controls_timeout = setTimeout (delegate (this, this.HideControls), 1000);
    },
    
    _OnMouseMove: function (o, args) {
        if (this.volume_dragging) {
            this._UpdateVolumeFromMouse (args);
        } else {
            this.ShowControls ();
        }
    },
    
    _OnMouseUp: function (o, args) {
        if (this.volume_dragging) {
            this._UpdateVolumeFromMouse (args);
            this.volume_dragging = false;
        }
    },
    
    _OnMediaCurrentStateChanged: function (o, args) {
        this.Log ("Media Element State Change: " + o.CurrentState);
        switch (o.CurrentState) {
            case "Opening":
            case "Buffering":
                break;
            case "Playing":
                this.xaml.play_icon_animation.To = 0;
                this.xaml.pause_icon_animation.To = 1;
                this.xaml.play_icon_storyboard.Begin ();
                this.xaml.pause_icon_storyboard.Begin ();
                
                this.xaml.seek_slider_played_storyboard.Resume ();
                
                this.timeout = setInterval (delegate (this, this._OnUpdatePosition), 500);
                break;
            case "Paused":
            case "Stopped":
                clearInterval (this.timeout);
            
                this.xaml.play_icon_animation.To = 1;
                this.xaml.pause_icon_animation.To = 0;
                this.xaml.play_icon_storyboard.Begin ();
                this.xaml.pause_icon_storyboard.Begin ();
                
                this.xaml.seek_slider_played_storyboard.Pause ();
                
                if (o.CurrentState == "Stopped") {
                    this._UpdatePositionDuration (0, 0, false);
                }
                break;
        }
    },
    
    _OnBufferingProgressChanged: function (o, args) {
        this.xaml.seek_slider_buffered.Width = this.xaml.seek_slider_trough.Width * o.BufferingProgress;
    },
    
    _OnDownloadProgressChanged: function (o, args) {
        this.xaml.seek_slider_downloaded.Width = this.xaml.seek_slider_trough.Width * o.DownloadProgress;
    },
    
    _OnMediaOpened: function (o, args) {
        this._PositionVideo ();
    },

    _OnMediaEnded: function (o, args) {
        this.Idle ();
        
        if (this.loop_playback) {
            this.Log ("Looping playback of current source");
            this.xaml.video_element.Play ();
        }
    },

    _OnUpdatePosition: function () {
        if (this.xaml.video_element.CurrentState == "Playing") {
            this._UpdatePositionDuration (this.xaml.video_element.Position.Seconds,
                this.xaml.video_element.NaturalDuration.Seconds, true);
        }
    },

    _OnPlayPauseClicked: function (o, args) {
        this.TogglePlaying ();
    },
    
    _OnOptionsClicked: function (o, args) {
        this.control.Content.FullScreen = !this.control.Content.FullScreen;    
    },
    
    _OnVolumeMouseDown: function (o, args) {
        this._ClearHideControlsTimeout ();
        this.volume_dragging = true;
    },
    
    // Utility Methods
    
    _UpdateVolumeFromMouse: function (args) {
        this.PlaybackVolume = args.GetPosition (this.xaml.volume_slider).X / this.xaml.volume_slider.Width;
    },
    
    _UpdateVolume: function () {
        this.xaml.volume_slider_level.Clip = "M 0,0 H" + (this.xaml.volume_slider.Width * 
            this.xaml.video_element.Volume) + " V100 H0 Z";
    },
    
    _ClearHideControlsTimeout: function () {
        if (this.hide_controls_timeout) {
            clearTimeout (this.hide_controls_timeout);
        }
    },
    
    ShowControls: function () {
        this._ClearHideControlsTimeout ();
        
        if (this.xaml.control_bar_animation.To != this.control_bar_visible_top) {
            this.xaml.control_bar_animation.To = this.control_bar_visible_top;
            this.xaml.control_bar_storyboard.Begin ();
        }
        
        this.hide_controls_timeout = setTimeout (delegate (this, this.HideControls), 3000);
    },
    
    HideControls: function () {
        this.volume_dragging = false;
        this.xaml.control_bar_animation.To = this.control_bar_hidden_top;
        this.xaml.control_bar_storyboard.Begin ();
    },
    
    _FormatSeconds: function (seconds) {
        return Math.floor (seconds / 60) + ":" + 
            (seconds % 60 < 10 ? "0" : "") +
            Math.floor (seconds % 60);
    },
    
    get PlaybackVolume () { return this.xaml.video_element.Volume; },
    set PlaybackVolume (x) { 
        this.xaml.video_element.Volume = Math.max (0, Math.min (x, 1));
        this._UpdateVolume ();
    },
    
    TogglePlaying: function () {
        if (this.xaml.video_element.CurrentState == "Playing") {
            this.xaml.video_element.Pause ();
        } else {
            this.xaml.video_element.Play ();
        }
    },

    // XAML Templates

    _CreateButton: function (name, icon_name) {
        var button = this.control.Content.createFromXaml ('\
            <Canvas Name="' + name + '" Width="27" Height="22" Background="transparent"> \
              <Rectangle Width="27" Height="22" RadiusX="2" RadiusY="2"> \
                <Rectangle.Fill> \
                  <LinearGradientBrush Name="' + name + 'Fill" StartPoint="0,0" EndPoint="0,1" Opacity="0"> \
                    <GradientStop Offset="0.0" Color="#7fff"/> \
                    <GradientStop Offset="0.2" Color="#6fff"/> \
                    <GradientStop Offset="0.8" Color="#0fff"/> \
                  </LinearGradientBrush> \
                </Rectangle.Fill> \
              </Rectangle> \
              <Rectangle Width="27" Height="22" RadiusX="2" RadiusY="2"> \
                <Rectangle.Stroke> \
                  <LinearGradientBrush Name="' + name + 'Border" StartPoint="0,0" EndPoint="0,1" Opacity="0"> \
                    <GradientStop Offset="0.0" Color="#afff"/> \
                    <GradientStop Offset="1.0" Color="#0fff"/> \
                  </LinearGradientBrush> \
                </Rectangle.Stroke> \
              </Rectangle> \
              <Canvas.Resources> \
                <Storyboard Name="' + name + 'Storyboard" Storyboard.TargetProperty="Opacity" Duration="0:0:0.3"> \
                  <DoubleAnimation Name="' + name + 'BorderAnimation" Storyboard.TargetName="' + name + 'Border"/> \
                  <DoubleAnimation Name="' + name + 'FillAnimation" Storyboard.TargetName="' + name + 'Fill"/> \
                </Storyboard> \
              </Canvas.Resources> \
            </Canvas> \
        ');
        
        button.AddEventListener ("mouseenter", delegate (this, function (o, args) {
            this._Animate ([o.FindName (o.Name + "FillAnimation"), o.FindName (o.Name + "BorderAnimation")], 1);
            o.FindName (o.Name + "Storyboard").Begin ();
        }));
        
        button.AddEventListener ("mouseleave", delegate (this, function (o, args) {
            this._Animate ([o.FindName (o.Name + "FillAnimation"), o.FindName (o.Name + "BorderAnimation")], 0);
            o.FindName (o.Name + "Storyboard").Begin ();
        }));
        
        if (icon_name == null) {
            return button;
        }

        var icon = this.control.Content.FindName (icon_name);
        if (icon == null) {
            return button;
        }

        this._Reparent (icon, button);

        icon["Canvas.Left"] = (button.Width - icon.Width) / 2;
        icon["Canvas.Top"] = (button.Height - icon.Height) / 2;
        icon.Visibility = "Visible";

        return button;
    },
    
    _Reparent: function (child, new_parent) {
        if (child) {
            var parent = child.GetParent ();
            if (parent) {
                parent.Children.Remove (child);
            }
            
            new_parent.Children.Add (child);
        }
    },
    
    _Animate: function (animations, to_value) {
        for (var i = 0, n = animations.length; i < n; i++) {
            animations[i].To = to_value;
        }
    },
    
    _ImplementWmpApi: function () {
        this.control["MoonMediaPlayer"] = this;
        this.control["controls"] = new __MoonEmbeddedWmpControls (this);
        
        var properties = [ "src", "source", "filename", "url" ];
        var self = this;
        for (var p in properties) {
            delete this.control[properties[p]];
            this.control.__defineSetter__ (properties[p], function (s) { self.LoadSource (s); });
            this.control.__defineGetter__ (properties[p], function () { return self.xaml.video_element.Source; });
        }
    },
    
    Log: function (x) {
        dump (x + "\n");
    },
}


