//
// This file is licensed under the MIT X11 open source license.
// http://www.opensource.org/licenses/mit-license.php
//
// Authors: Aaron Bockover <abockover@novell.com>
//
// Copyright 2009 Novell, Inc.
// 

function StandaloneMoonPlayer () {
    this.className = "StandaloneMoonPlayer";
    try {
        this.Initialize ();
    } catch (e) {
        MtkConsole.ObjDump (e, true);
    }
}

StandaloneMoonPlayer.prototype = {

    content: null,
    player: null,
    command_line: null,
    player_element: null,

    Initialize: function () {
        if (window.player) {
            throw "StandaloneMoonPlayer already installed on window";
        }

        this.command_line = window.arguments[0]
            .QueryInterface (Components.interfaces.nsICommandLine);

        window.player = this;
        
        this.content = document.getElementById ("moon-media-standalone-player");
        this.player_element = document.getElementById ("moon-embedded-player");

        this.ConfigureWindow ();
        this.CheckForMoonlight ();
    },

    CheckForMoonlight: function () {
        var plugin = navigator.plugins["Silverlight Plug-In"];
        if (!plugin) {
            document.getElementById ("uninstalled").style.display = "block";
            this.player_element.style.display = "none";
        }
    },

    MoonlightInitialize: function () {
        this.player = new MoonshinePlayer;
    
        var file_arg = this.command_line && this.command_line.length > 0
            ? this.command_line.getArgument (0)
            : null;
        if (file_arg && file_arg.length > 0) {
            this.LoadSource (file_arg);
        }
        
        this.player.Screen.Override ("GetFullScreen", function () window.fullScreen);        
        
        this.player.Screen.Override ("SetFullScreen", function (fs) {
            window.fullScreen = fs;
            document.getElementById ("moon-media-menu-bar").collapsed = window.fullScreen;
            
            // Necessary to overcome a race with the window resizing; Mozilla does not 
            // actually touch the window until the next idle, so its size will be incorrect
            // without pushing a callback into the idle queue
            setTimeout (delegate (this, function () this.RaiseEvent ("FullScreenChanged")), 100);
        });
    },
    
    ConfigureWindow: function () {
        document.title = "Moonshine";

        // MeeGo specific path - always maximize the window on MeeGo
        var file = Components.classes["@mozilla.org/file/local;1"].
            createInstance (Components.interfaces.nsILocalFile);
        file.initWithPath ("/etc/meego-release");
        if (file.exists ()) {
            // window.maximize can't be called inside window.load
            setTimeout (function () window.maximize (), 1);
        }
    },

    LoadSource: function (path) {
        this.player.Source = decodeURI (this.command_line.resolveURI (path).spec);
    },

    OnFileOpen: function () {
        const nsIFilePicker = Components.interfaces.nsIFilePicker;
        var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance (nsIFilePicker);
        fp.init (window, "Select a File", nsIFilePicker.modeOpen);
        fp.appendFilter ("Media Files", 
            "*.mp3; *.MP3; *.wma; *.WMA; *.wmv; *.WMV; *.asf; *.ASF; " + 
            "*.asx; *.ASX; *.wvx; *.WVX; *.wax; *.WAX; *.wm; *.WM");
        var res = fp.show ();
        if (res == nsIFilePicker.returnOK) {
            this.LoadSource (fp.file.path); 
        }
    },

    OnAbout: function () {
        this.player.About ();
    }
}

