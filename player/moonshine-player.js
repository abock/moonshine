function MoonshinePlayer (control) {
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

