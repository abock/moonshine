function MoonshinePlayer () {
    MtkWindow.call (this);
    
    //
    // Window
    //
    
    this.Xaml.AddEventListener ("keydown", delegate (this, function (o, args) {
        switch (args.Key) {
            /* F, F11 */ case 35: case 66: this.Screen.ToggleFullScreen (); break;
            /* Spc,Etr*/ case 9:  case 3: this.TogglePlaying (); break;
            /* Esc    */ case 8:  this.Screen.SetFullScreen (false); break;
            /* Up     */ case 15: this.Volume += 0.05; break;
            /* Down   */ case 17: this.Volume -= 0.05; break;
            /* Left   */ case 14: this.Position -= args.Ctrl ? 60 : 15; break;
            /* Right  */ case 16: this.Position += args.Ctrl ? 60 : 15; break;
            /* A      */ case 30: this.About (); break;
        }
        
        this.ShowControls ();
    }));
    
    this.BuildWindow = function () {
        this.Background = "black";
    
        this.ErrorPopup = new MoonshineErrorPopup ();
        this.BufferingPopup = new MoonshineBufferingPopup ();
        this.AboutPopup = new MoonshineAboutPopup (this);
    
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
            
            if (state == "Error") {
                this.ErrorPopup.FadeIn ();
            } else {
                this.ErrorPopup.FadeOut ();
            }
            
            if (state == "Buffering") {
                this.BufferingPopup.FadeIn ();
            } else {
                this.BufferingPopup.FadeOut ();
            }
        }));
        
        this.MediaElement.AddEventListener ("BufferingProgressChanged", delegate (this, function () {
            this.BufferingPopup.Progress = this.MediaElement.BufferingProgress;
        }));
    };
    
    this.__defineSetter__ ("CenteredOffset", function (y) {
        this.ErrorPopup.CenteredOffsetY = y;
        this.BufferingPopup.CenteredOffsetY = y;
        this.AboutPopup.CenteredOffsetY = y;
    });
    
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
    this.__defineSetter__ ("Source", function (x) {
        MtkConsole.Log ("Loading source: " + x);
        this.MediaElement.Source = x;
    });
    
    this.__defineGetter__ ("Volume", function () this.MediaElement.Volume);
    this.__defineSetter__ ("Volume", function (x) 
        this.Controls.VolumeBar.Slider.Value = MtkColor.Clamp (x, 0, 1));
    
    this.__defineGetter__ ("ControlsVisible", function () this.Controls.Visible);
    this.__defineSetter__ ("ControlsVisible", function (x) this.Controls.Visible = x);
    
    this.__defineGetter__ ("AutoPlay", function () this.MediaElement.AutoPlay);
    this.__defineSetter__ ("AutoPlay", function (x) this.MediaElement.AutoPlay = x);
    
    this.__defineGetter__ ("LoopPlayback", function () this.MediaElement.LoopPlayback);
    this.__defineSetter__ ("LoopPlayback", function (x) this.MediaElement.LoopPlayback = x);
    
    this.__defineGetter__ ("CanSeek", function () this.MediaElement.CanSeek);
    
    this.__defineGetter__ ("IsLive", function () this.MediaElement.IsLive);
    
    this.__defineGetter__ ("Position", function ()
        this.MediaElement.Position && !this.IsLive ? this.MediaElement.Position.Seconds : 0);
    this.__defineSetter__ ("Position", function (x) {
        if (this.CanSeek && !this.IsLive && !isNaN (x)) {
            this.MediaElement.Position = "0:0:" + x;
        }
    });
    
    this.__defineGetter__ ("Duration", function () 
        this.MediaElement.NaturalDuration ? this.MediaElement.NaturalDuration.Seconds : 0);
    
    this.__defineGetter__ ("PositionString", function () this.MediaElement.FormatSeconds (this.Position));
    
    this.__defineGetter__ ("DurationString", function () this.MediaElement.FormatSeconds (this.DurationString));
    
    this.Play = function () this.MediaElement.Play ();
    this.Pause = function () this.MediaElement.Pause ();
    this.Stop = function () this.MediaElement.Stop ();
    this.TogglePlaying = function () this.MediaElement.TogglePlaying ();
    
    this.About = function () {
        this.AboutPopup.AppName = "Moonshine";
        this.AboutPopup.ToggleFade ();
    };
    
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

    this.FlexBar = new MtkXaml ("<Canvas/>");
    this.FlexBar.Visible = false;
    
    this.PlayPauseButton = new MoonshinePlayPauseButton (media_element);
    this.SeekBar = new MoonshineSeekBar (media_element);
    this.VolumeBar = new MoonshineVolumeBar (media_element);
    this.FullScreenButton = new MoonshineFullScreenButton;

    this.PackStart (this.PlayPauseButton);
    this.PackStart (this.SeekBar, true);
    this.PackStart (this.VolumeBar);
    this.PackStart (this.FlexBar, true);
    this.PackStart (this.FullScreenButton);
    
    media_element.AddEventListener ("MediaOpened", delegate (this, function () {
        this.PlayPauseButton.Visible = media_element.CanPause;
        this.SeekBar.Visible = media_element.CanSeek;
        this.FlexBar.Visible = !this.SeekBar.Visible;
        this.VolumeBar.XPad = this.FlexBar.Visible ? 4 : 0;
    }));
    
    this.AfterConstructed ();
}

function MoonshinePopup () {
    MtkPopup.call (this);
    
    this.Padding = 20;
    
    this.Xaml.Children.Add (this.CreateXaml ('<Rectangle Name="' + this.Name + 'Background"/>'));
    this.PositionCenter ();
        
    this.Override ("OnStyleSet", function () {
        this.background_fill = MtkStyle.CreateLinearGradient (this,
            [0, 1], ["#d111", "#e000"]
        );
        
        this.background_stroke = "#4fff";
    });
    
    this.Override ("OnRealize", function () {
        this.$OnRealize$ ();
        if (!this.IsRealized) {
            return;
        }
    });
        
    this.Override ("OnSizeAllocate", function () {
        if (!this.IsRealized) {
            return;
        }
        
        this.$OnSizeAllocate$ ();
        
        var elem = this.XamlFind ("Background");
        if (!elem) {
            return;
        }
        
        elem.Width = this.Allocation.Width;
        elem.Height = this.Allocation.Height;
        elem.Fill = this.background_fill;
        elem.Stroke = this.background_stroke;
        elem.StrokeThickness = 1;
        elem.RadiusX = this.XPad / 2;
        elem.RadiusY = this.YPad / 2;
    });
}

function MoonshineBufferingPopup () {
    MoonshinePopup.call (this);
    
    this.Label = new MtkLabel ("Buffering...");
    this.Label.CustomForeground = true;
    this.Label.FontWeight = "Bold";
    this.Label.Xaml.Foreground = "#ddd";
    
    this.__defineSetter__ ("Progress", function (x) {
        this.Label.Text = "Buffering: " + Math.round (x * 100).toString () + "%";
    });
    
    this.Add (this.Label);
}


function MoonshineErrorPopup () {
    MoonshinePopup.call (this);
    
    this.Box = new MtkVBox;
    this.Box.Spacing = 5;
    
    this.Header = new MtkLabel ("Error");
    this.Header.CustomForeground = true;
    this.Header.CustomSize = true;
    this.Header.FontSize = MtkStyle.Font.Size + 3;
    this.Header.FontWeight = "Bold";
    this.Header.Foreground = "#c00";
    
    this.Message = new MtkLabel ("The requested media could not be played.");
    this.Message.CustomForeground = true;
    this.Message.Foreground = "#ddd";
    
    this.Add (this.Box);
    this.Box.PackStart (this.Header);
    this.Box.PackStart (this.Message);
}

function MoonshineAboutPopup (host) {
    MoonshinePopup.call (this);
    
    this.Box = new MtkVBox;
    this.Box.Spacing = 8;
    
    this.HeaderSize = MtkStyle.Font.Size + 8;
    this.TextSize = MtkStyle.Font.Size + 4;
    
    this.Message = new MtkXaml ('<TextBlock Width="300" TextWrapping="Wrap" FontFamily="Trebuchet MS, ' + MtkStyle.Font.Family + '"> \
        <Run FontSize="' + this.HeaderSize + '" Foreground="#3465a4" FontWeight="Bold" Text="Moonshine" />  \
        <Run FontSize="' + this.HeaderSize + '" Foreground="#4e9a06" FontWeight="Bold" Text="v0.7" />  \
        <LineBreak FontSize="50"/> \
        <Run FontSize="' + this.TextSize + '" Foreground="#eee"> \
            Windows Media support for Linux, powered by \
            Moonlight and Firefox. \
        </Run> \
        <LineBreak/> \
        <Run FontSize="' + (this.TextSize - 3) + '" Foreground="#888" Text="Written by Aaron Bockover" /> \
        <LineBreak/> \
        <Run FontSize="' + (this.TextSize - 4) + '" Foreground="#666" Text="Copyright 2009-2010 Novell." /> \
    </TextBlock>');
    
    this.CloseBox = new MtkHBox;
    this.CloseButton = new MtkButton (new MtkLabel ("Close"));
    this.CloseButton.AddEventListener ("Activated", delegate (this, function () this.ToggleFade ()));
    this.CloseButton.RestOpacity = 0.8;
    this.CloseBox.PackStart (new MtkXaml ("<Canvas/>"), true);
    this.CloseBox.PackStart (this.CloseButton);
    
    this.Add (this.Box);
    this.Box.PackStart (this.Message);
    this.Box.PackStart (this.CloseBox);

    this.__defineSetter__ ("AppName", function (name) {
        this.Message.Xaml.Inlines.GetItem (0).Text = name;
    });

    host.Xaml.AddEventListener ("keydown", delegate (this, function (o, args) {
        if ((args.Key == 45 && !this.p) ||
            (args.Key == 44 && this.p == 1) ||
            (args.Key == 47 && this.p == 2) ||
            (args.Key == 43 && this.p == 3)) {
            this.p = !this.p ? 1 : this.p + 1;
            if (this.p == 4) {
                this.AppName = String.fromCharCode (0x50, 0x6F, 0x72, 0x6E, 
                    0x69, 0x6C, 0x75, 0x73);
                this.ToggleFade ();
                this.p = 0;
            }
        } else {
            this.p = 0;
        }
    }));
}

