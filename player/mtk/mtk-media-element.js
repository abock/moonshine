//
// This file is licensed under the MIT X11 open source license.
// http://www.opensource.org/licenses/mit-license.php
//
// Authors: Aaron Bockover <abockover@novell.com>
//
// Copyright 2009 Novell, Inc.
// 

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
        this.Debug ("Media State Change: " + this.CurrentState);
        
        switch (this.CurrentState) {
            case "Playing":
                this.play_timeout = setInterval (delegate (this, this.OnPlayTick), 500);
                break;
            case "Paused":
            case "Stopped":
                clearInterval (this.play_timeout);
                this.play_timeout = null;
                break;
            case "Closed":
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
        
        var percent = live || !dur || !pos ? 0 : pos.Seconds / dur.Seconds;
        if (isNaN (percent) || percent < 0 || percent > 1) {
            percent = 0;
        }
        
        this.RaiseEvent ("PlayTick", pos, dur, percent, live);
    });
    
    this.Virtual ("OnMediaOpened", function () {
        this.Debug ("Media Opened");
        this.RaiseEvent ("MediaOpened");
    });
    
    this.Virtual ("OnMediaEnded", function () {
        this.OnIdle ();
        
        if (this.LoopPlayback) {
            this.Play ();
        } else {
            this.Stop ();
        }
    });
    
    this.Virtual ("OnBufferingProgressChanged", function () {
        this.RaiseEvent ("BufferingProgressChanged");
    });
    
    this.Virtual ("OnDownloadProgressChanged", function () {
        this.RaiseEvent ("DownloadProgressChanged");    
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
    
    this.FormatSeconds = function (seconds) {
        return Math.floor (seconds / 60) + ":" + 
            (seconds % 60 < 10 ? "0" : "") +
            Math.floor (seconds % 60);
    };
    
    this.Debug = function (msg) {
         MtkConsole.Log (msg + " [ IsLive: " + this.IsLive + 
            ", CanSeek: " + this.CanSeek + ", CanPause: " + this.CanPause + " ]");
    };
    
    this.AfterConstructed ();
}
