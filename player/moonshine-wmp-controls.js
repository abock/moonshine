//
// This file is licensed under the MIT X11 open source license.
// http://www.opensource.org/licenses/mit-license.php
//
// Authors: Aaron Bockover <abockover@novell.com>
//
// Copyright 2009 Novell, Inc.
// 

function MoonshinePluginPlayerWmpControls (moonshine_player) {
    this.MoonshinePlayer = moonshine_player;
}

MoonshinePluginPlayerWmpControls.prototype = {

    // Pauses the playing of the media item.
    pause: function () {
        this.MoonshinePlayer.Pause ();
    },

    // Causes the media item to start playing.
    play: function () {
        this.MoonshinePlayer.Play ();
    },

    // Stops the playing of the media item.
    stop: function () {
        this.MoonshinePlayer.Stop ();
    },
    
    // Causes the current media item to start playing, or resumes play of a paused item.
    playItem: function (item) {
    },

    // Starts fast play of the media item in the forward direction.
    fastForward: function () {
    },

    // Starts fast play of the media item in the reverse direction.
    fastReverse: function () {
    },

    // Causes the current video media item to freeze playback on the next frame.
    step: function (frameCount) {
        // must be -1 or 1
    },
    
    // Sets the current item to the next item in the playlist.
    next: function () {
    },

    // Sets the current item to the previous item in the playlist.
    previous: function () {
    },
    
    // Retrieves the description for the audio language corresponding to the specified one-based index.
    getAudioLanguageDescription: function (index) {
        return null;
    },

    // Retrieves the LCID for a specified audio language index.
    getAudioLanguageID: function (index) {
        return 0;
    },

    // Retrieves the name of the audio language with the specified LCID.
    getLanguageName: function (LCID) {
        return null;   
    },
    
    // Retrieves whether a specified type of information is available or a given action can be performed.
    isAvailable: function (name) {
        switch (name) {
            case "currentItem":     return false;
            case "currentMarker":   return false;
            case "currentPosition": return true;
            case "fastForward":     return false;
            case "fastReverse":     return false;
            case "next":            return false;
            case "pause":           return true;
            case "play":            return true;
            case "previous":        return false;
            case "step":            return false;
            case "stop":            return true;
            default:                return false;
        }
    },
    
    // Specifies or retrieves the current position in the media item in seconds from the beginning.
    get currentPosition () { return this.MoonshinePlayer.Position; },
    set currentPosition (p) { this.MoonshinePlayer.Position = p; },
    
    // Retrieves the current position in the media item as a String.
    get currentPositionString () { return this.MoonshinePlayer.PositionString; },
    
    // Specifies or retrieves the current position in the current media item using a time code format. 
    // This property currently supports SMPTE time code.
    get currentPositionTimecode () { return null; },
    
    // Specifies or retrieves the current media item.
    get currentItem () { return null; },
    set currentItem (item) { },

    // Specifies or retrieves the current marker number.
    get currentMarker () { return 0; },
    set currentMarker (m) { },
    
    // Retrieves the number of supported audio languages.
    get audioLanguageCount () { return 1; },

    // Specifies or retrieves the locale identifier (LCID) of the audio language for playback
    get currentAudioLanguage () { return 0; },

    // Specifies or retrieves the one-based index that corresponds to the audio language for playback.
    get currentAudioLanguageIndex () { return 0; },
    set currentAudioLanguageIndex () { }
}

