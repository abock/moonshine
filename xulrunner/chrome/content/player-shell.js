function XULMoonEmbeddedPlayerInit (player) {
    // Install the Silverlight Player on the XUL Player
    window.player.player = player;
    window.player.MoonlightInitialize ();
}

function StandaloneMoonPlayer () {
    this.className = "StandaloneMoonPlayer";
    try {
        this.Initialize ();
    } catch (e) {
        MoonConsole.ObjDump (e, true);
    }
}

StandaloneMoonPlayer.prototype = {

    content: null,
    player: null,
    command_line: null,
    player_element: null,
    about_element: null,

    Initialize: function () {
        if (window.player) {
            throw "StandaloneMoonPlayer already installed on window";
        }

        this.command_line = window.arguments[0]
            .QueryInterface (Components.interfaces.nsICommandLine);

        window.player = this;
        
        this.content = document.getElementById ("moon-media-standalone-player");
        this.player_element = document.getElementById ("moon-embedded-player");
        this.about_element = document.getElementById ("about-panel");

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
        file_arg = this.command_line.getArgument (0);
        if (file_arg && file_arg.length > 0) {
            this.LoadSource (file_arg);
        }

        this.player.fullscreen_hook = delegate (this, this.OnFullscreen);
        this.player.get_is_fullscreen_hook = function () window.fullScreen;
        this.player.IsControlBarDocked = true;
    },
    
    ConfigureWindow: function () {
        document.title = "Moonshine";
    },

    LoadSource: function (path) {
        this.player.LoadSource (decodeURI (this.command_line.resolveURI (path).spec));
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

    OnFullscreen: function () {
        setTimeout (delegate (this, function () {
            window.fullScreen = !window.fullScreen;
            document.getElementById ("moon-media-menu-bar").collapsed = window.fullScreen;
            this.player.IsControlBarDocked = !window.fullScreen;
            this.player._OnFullScreenChange ();
        }), 1); 
    },

    OnAbout: function () {
        this.about_element.style.display = "block";
    },

    OnCloseAbout: function () {
        this.about_element.style.display = "none";
    }
}

