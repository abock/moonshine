function __MoonshineWmpPluginBindInstance (control) {
    MtkScreenBinder.BindScreen (control);
    new MoonshinePluginPlayer (control);
}

function MoonshinePluginPlayer (control) {

    this.MoonshinePlayer = new MoonshinePlayer;
    this.WmpControl = control.GetHost ();

    // properties we wish to override for setting media location
    this.MediaSourceProperties = [ "src", "source", "filename", "url" ];
    
    this.MapWmpAttributes = function () {
        for (var i = 0; i < this.WmpControl.attributes.length; i++) {
            var attr = this.WmpControl.attributes[i];
            this.MapWmpAttribute (attr.name, attr.value);
        }

        var params = this.WmpControl.childNodes;
        if (params) {
            for (var i = 0, n = params.length; i < n; i++) {
                if (params[i] instanceof HTMLParamElement) {
                    this.MapWmpAttribute (params[i].name, params[i].value);
                }
            }
        }
    },

    this.MapWmpAttribute = function (name, value) {
        function to_bool (x) {
            return x.toLowerCase () == "true";
        }

        var param = name.toLowerCase ();
        switch (param) {
            case "background":
            case "bgcolor":      this.MoonshinePlayer.Background = value; break;
            case "showcontrols": this.MoonshinePlayer.ControlsVisible = to_bool (value); break;
            case "autostart":    this.MoonshinePlayer.AutoPlay = to_bool (value); break;
            case "loop":         this.MoonshinePlayer.LoopPlayback = to_bool (value); break;     
        }

        for (var j = 0; j < this.MediaSourceProperties.length; j++) {
            if (this.MediaSourceProperties[j] == param) {
                this.MoonshinePlayer.Source = value;
                break;
            }
        }
    };

    this.ImplementWmpApi = function () {
        this.WmpControl["controls"] = new MoonshinePluginPlayerWmpControls (this.MoonshinePlayer);
        
        var self = this;
        var properties = this.MediaSourceProperties;
        for (var p in properties) {
            delete this.WmpControl[properties[p]];
            this.WmpControl.__defineSetter__ (properties[p], function (s) self.MoonshinePlayer.Source = s);
            this.WmpControl.__defineGetter__ (properties[p], function () self.MoonshinePlayer.Source);
        }
    };
    
    this.MapWmpAttributes ();
    this.ImplementWmpApi ();
}



