function delegate (target, callback) {
    return function () { callback.apply (target, arguments); }
}

MediaPlayer = function (silverDom) {
    this.silver = silverDom;
    this.silver.OnLoad = delegate (this, this._OnLoad);
}

MediaPlayer.prototype = {
    silver: null,
    xaml: null,
    loaded: false,

    video_zoom: 1.0,
    video_fit_window: false,
    video_larry_mode: false,
    max_video_width: 0,
    max_video_height: 0,

    control_spacing: 3,
    control_block_spacing: 10,
    control_seek_spacing: 5,
    control_bar_height: 28,

    _OnLoad: function (control, context, root_element) {
        this.xaml = {
            root:               control,

            background:         control.FindName ("Background"),

            video_element:      control.FindName ("VideoElement"),
            video_window:       control.FindName ("VideoWindow"),
            video_brush:        control.FindName ("VideoBrush"),

            control_bar:        control.FindName ("ControlBar"),
            left_controls:      control.FindName ("LeftControls"),
            center_controls:    control.FindName ("CenterControls"),
            right_controls:     control.FindName ("RightControls"),

            seek_slider:        control.FindName ("SeekSlider"),
            seek_slider_border: control.FindName ("SeekSliderBorder"),
            seek_slider_trough: control.FindName ("SeekSliderTrough"),
            position:           control.FindName ("Position"),
            position_text:      control.FindName ("PositionText"),

            play_button:        this._CreateButton ("PlayButton", "PlayIcon"),
            pause_button:       this._CreateButton ("PauseButton", "PauseIcon"),

            options_button:     this._CreateButton ("OptionsButton")
        };

        this._ConstructInterface ();
        this._ConnectEvents ();
        this.Idle ();
        this._LoadContent ();

        this.silver.Content.OnResize = delegate (this, this._OnResize);
        this.silver.Content.OnFullScreenChange = delegate (this, this._OnFullScreenChange);
        this.loaded = true;
    },

    _ConstructInterface: function () {
        this._ContainerPack (this.xaml.left_controls, this.xaml.play_button);
        this._ContainerPack (this.xaml.left_controls, this.xaml.pause_button, 2);

        this._ContainerPack (this.xaml.right_controls, this.xaml.options_button);
    },

    _ContainerPack: function (container, child, leading_pad) {
        var left = 0;
        for (i = 0, n = container.Children.Count; i < n; i++) {
            var _child = container.Children.GetItem (i);
            left += _child["Canvas.Left"];
            if (i == n - 1) {
                left += _child.Width + leading_pad;
            }
        }
        
        child["Canvas.Left"] = left;
        container.Children.Add (child);
    },

    _ContainerAutosize: function (container) {
        var max_width = 0;
        var max_height = 0;

        for (i = 0, n = container.Children.Count; i < n; i++) {
            var child = container.Children.GetItem (i);
            max_width = Math.max (child["Canvas.Left"] + child.Width, max_width);
            max_height = Math.max (child.Height, max_height);
        }

        container.Width = max_width;
        container.Height = max_height;
    },

    _ConnectEvents: function () {
        this.xaml.root.AddEventListener ("keydown", delegate (this, this._OnKeyDown));
        
        this.xaml.play_button.AddEventListener ("mouseleftbuttondown", delegate (this, this._OnPlayClicked));
        this.xaml.pause_button.AddEventListener ("mouseleftbuttondown", delegate (this, this._OnPauseClicked));

        this.xaml.video_element.AddEventListener ("mediaopened", delegate (this, this._OnMediaOpened));
        this.xaml.video_element.AddEventListener ("mediaended", delegate (this, this._OnMediaEnded));
    },
    
    _LoadContent: function () {
        Log ("Loading source: " + __moon_media_source_uri);
        this.xaml.video_element.Source = __moon_media_source_uri;
    },

    // Layout and Positioning Logic

    _OnResize: function () {
        this.xaml.background.Width = this.silver.Content.ActualWidth;
        this.xaml.background.Height = this.silver.Content.ActualHeight; 

        // position the main control bar
        this.xaml.control_bar.Width = this.xaml.background.Width;
        this.xaml.control_bar.Height = this.control_bar_height;
        this.xaml.control_bar.Left = 0;
        this.xaml.control_bar.Top = this.xaml.background.Height - this.xaml.control_bar.Height;

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
        this._PositionSlider ();

        // calculate video constraints
        this.max_video_width = this.xaml.background.Width;
        this.max_video_height = this.xaml.background.Height - this.xaml.control_bar.Height;

        this._PositionVideo ();
    },

    _OnFullScreenChange: function () {
        this._OnResize ();
    },

    _PositionSlider: function () {
        // In case we need to clip...
        // this.xaml.position_text.Clip = "M 0,0 H" + this.xaml.position.Width + " V" + 
        //     this.xaml.position.Height + " H0 Z";

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

        this.xaml.video_window.Visibility = frame_width > 0 && frame_height > 0 
            ? "Visible" 
            : "Collapsed";
    },

    // Media/UI Interaction and Control

    Idle: function () {
        this._UpdatePositionDuration (0, 0);
    },

    _UpdatePositionDuration: function (position, duration) { 
        var runs = this.xaml.position_text.Inlines.Count;        
        this.xaml.position_text.Inlines.GetItem (0).Text = this._FormatSeconds (position);
        this.xaml.position_text.Inlines.GetItem (runs - 1).Text = this._FormatSeconds (duration);
        this._PositionSlider ();
    },

    _OnKeyDown: function (o, args) {
        if (args.Key == 35 || args.Key == 66) {
            o.GetHost ().Content.FullScreen = true;
        }
    },
    
    _OnMediaOpened: function (o, args) {
        this.timeout = setInterval (delegate (this, this._OnUpdatePosition), 500);
        this._PositionVideo ();
    },

    _OnMediaEnded: function (o, args) {
        clearInterval (this.timeout);
        this.Idle ();
    },

    _OnUpdatePosition: function () {
        this._UpdatePositionDuration (this.xaml.video_element.Position.Seconds,
            this.xaml.video_element.NaturalDuration.Seconds);
    },

    _OnPlayClicked: function (o, args) {
        this.xaml.video_element.Play ();
    },

    _OnPauseClicked: function (o, args) {
        this.xaml.video_element.Pause ();
    },

    _OnStopClicked: function (o, args) {
        this.xaml.video_element.Stop ();
    },

    // Utility Methods

    _FormatSeconds: function (seconds) {
        return Math.floor (seconds / 60) + ":" + 
            (seconds % 60 < 10 ? "0" : "") +
            Math.floor (seconds % 60);
    },

    // XAML Templates

    _CreateButton: function (name, icon_name) {
        var button = this.silver.Content.createFromXaml ('\
            <Canvas Name="' + name + '" Width="27" Height="22"> \
              <Rectangle Width="27" Height="22" RadiusX="2" RadiusY="2"> \
                <Rectangle.Stroke> \
                  <LinearGradientBrush StartPoint="0,0" EndPoint="0,1"> \
                    <GradientStop Offset="0.0" Color="#55ffffff"/> \
                    <GradientStop Offset="1.0" Color="#00ffffff"/> \
                  </LinearGradientBrush> \
                </Rectangle.Stroke> \
              </Rectangle> \
            </Canvas> \
        ');

        if (icon_name == null) {
            return button;
        }

        var icon = this.silver.Content.FindName (icon_name);
        if (icon == null) {
            return button;
        }

        icon.GetParent ().Children.Remove (icon);
        button.Children.Add (icon);

        icon["Canvas.Left"] = (button.Width - icon.Width) / 2;
        icon["Canvas.Top"] = (button.Height - icon.Height) / 2;
        icon.Visibility = "Visible";

        return button;
    }
}

new MediaPlayer (FindSilverlightObject (__moon_media_embed_id));

