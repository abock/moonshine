var MoonUtilities = {
    
    _user_home_dir: null,
    get user_home_dir () {
        if (!MoonUtilities._user_home_dir) {
            var file = Components.classes["@mozilla.org/file/directory_service;1"]
                .getService (Components.interfaces.nsIProperties)
                .get ("Home", Components.interfaces.nsIFile);
            MoonUtilities._user_home_dir = file.path;
        }

        return MoonUtilities._user_home_dir;
    },

    PathToURI: function (path) {
        if (/^[A-Za-z0-9]+:\/\//.test (path)) {
            return path;
        }

        if (path.charAt (0) == "~") {
            path = MoonUtilities.user_home_dir + path.substring (1);
        }

        return "file:///" + path
            .replace (/\\/g, "\/")
            .replace (/^\s*\/?/, "")
            .replace (/\ /g, "%20");
    }
}

