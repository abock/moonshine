function delegate (target, callback) function () callback.apply (target, arguments);

var MtkContext = {    
    
    MtkBaseUri: null,

    Initialize: function () {
        /*if (typeof MtkObject == "undefined") {
            MtkContext.LoadMtkModules (
                "mtk-console.js",   "mtk-style.js", "mtk-object.js", "mtk-widget.js",
                "mtk-container.js", "mtk-box.js",   "mtk-window.js", "mtk-xaml.js",
                "mtk-button.js",    "mtk-label.js", "mtk-slider.js", "mtk-media-element.js",
                "mtk-toolbar.js",   "mtk-color.js"
            );
        }*/
    },

    LoadMtkModules: function () {
        if (!MtkContext.MtkBaseUri) {
             var script_elems = document.getElementsByTagName ("script");
             for (var i = 0, n = script_elems.length; i < n; i++) {
                var elem = script_elems[i];
                var ofs = elem.src.lastIndexOf ('/') + 1;
                if (elem.src.substring (ofs) == "mtk.js") {
                    MtkContext.MtkBaseUri = elem.src.substring (0, ofs);
                }
            }
        }

        var head = document.getElementsByTagName ("head")[0];
        for (var i = 0; i < arguments.length; i++) {
            var elem = document.createElement ("script");
            elem.setAttribute ("type", "text/javascript");
            elem.setAttribute ("src", MtkContext.MtkBaseUri + arguments[i]);
            head.appendChild (elem);
        }
    },
    
    XamlHost: null,

    SilverlightOnLoad: function (control) {
        this.XamlHost = control.GetHost (); 
    },

    IsWidget: function (o) o && o instanceof Object && o.IsMtkWidget
};

MtkContext.Initialize ();

