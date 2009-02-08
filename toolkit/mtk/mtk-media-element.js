function MtkMediaElement (settings) {
    MtkWidget.call (this, settings);
    this.InitFromXaml ("<MediaElement/>");
    
    this.play_timeout = null;
    this.LoopPlayback = false;
    this.AllowReplay = true;
    
    this.MapProperties ([
        "AutoPlay",
        "CurrentState",
        "DownloadProgress",
        "BufferingProgress",
        "BufferingTime",
        "Position",
        "NaturalDuration",
        "CanPause",
        "CanSeek",
        "IsMuted",
        "Volume"
    ]);
    
    this.Override ("OnRealize", function () {
        this.$OnRealize$ ();
        if (!this.IsRealized) {
            return;
        }
    
        this.Xaml.AddEventListener ("CurrentStateChanged", delegate (this, this.OnCurrentStateChanged));
        this.Xaml.AddEventListener ("BufferingProgressChanged", delegate (this, this.OnBufferingProgressChanged));
        this.Xaml.AddEventListener ("DownloadProgressChanged", delegate (this, this.OnDownloadProgressChanged));
        this.Xaml.AddEventListener ("MediaOpened", delegate (this, this.OnMediaOpened));
        this.Xaml.AddEventListener ("MediaEnded", delegate (this, this.OnMediaEnded));
    });
    
    this.Virtual ("OnIdle", function () this.RaiseEvent ("Idle"));
    
    this.Virtual ("OnCurrentStateChanged", function () {
        MtkConsole.Log ("Media Element State Change: " + this.CurrentState);
        
        switch (this.CurrentState) {
            case "Playing":
                this.play_timeout = setInterval (delegate (this, this.OnPlayTick), 500);
                break;
            case "Paused":
            case "Stopped":
                clearInterval (this.play_timeout);
                this.play_timeout = null;
                
                if (this.CurrentState == "Stopped") {
                    this.Xaml.Source = null;
                    if (!this.AllowReplay) {
                        this.source = null;
                    }
                }
                break;
        }
    
        this.RaiseEvent ("CurrentStateChanged", this.CurrentState);
    });
    
    this.Virtual ("OnPlayTick", function () {
        var live = this.IsLive;
        var pos = this.Position;
        var dur = this.NaturalDuration;
        this.RaiseEvent ("PlayTick", pos, dur, live ? 0 : pos.Seconds / dur.Seconds, live);
    });
    
    this.Virtual ("OnMediaOpened", function () this.RaiseEvent ("MediaOpened"));
    
    this.Virtual ("OnMediaEnded", function () {
        this.OnIdle ();
        
        if (this.LoopPlayback) {
            this.Play ();
        } else {
            this.Stop ();
        }
    });
    
    this.Virtual ("OnBufferingProgressChanged", function () {
    
    });
    
    this.Virtual ("OnDownloadProgressChanged", function () {
    
    });
    
    this.__defineGetter__ ("IsLive", function () this.NaturalDuration == null);
    this.__defineGetter__ ("IsPlaying", function () this.CurrentState == "Playing");
    
    this.Play = function () {
        if (!this.Source && this.CurrentState == "Closed" && this.source) {
            this.Source = this.source;
        }
        
        this.Xaml.Play ();
    };
    
    this.Pause = function () this.Xaml.Pause ();
    this.Stop = function () this.Xaml.Stop ();
    
    this.TogglePlaying = function () {
        if (this.CurrentState == "Playing") {
            this.Pause ();
        } else {
            this.Play ();
        }
    };
    
    this.source = null;
    this.__defineGetter__ ("Source", function () this.Xaml.Source);
    this.__defineSetter__ ("Source", function (x) {
        this.source = x;
        this.Xaml.Source = x;
    });
    
    this.AfterConstructed ();
}
