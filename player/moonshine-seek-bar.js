//
// This file is licensed under the MIT X11 open source license.
// http://www.opensource.org/licenses/mit-license.php
//
// Authors: Aaron Bockover <abockover@novell.com>
//
// Copyright 2009 Novell, Inc.
// 

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
        
        this.media_element.AddEventListener ("CurrentStateChanged", delegate (this, function () {
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
        if (!this.IsDragging) {
            return;
        }
        
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

