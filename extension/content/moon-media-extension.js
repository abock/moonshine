var MoonMediaExtension = {

    SupportedMimeTypes: [
        "application/x-mplayer2",
        "video/x-ms-asf-plugin",
        "video/x-msvideo",
        "video/x-ms-asf",
        "video/x-ms-wmv",
        "video/x-wmv",
        "video/x-ms-wvx",
        "video/x-ms-wm",
        "video/x-ms-wmp",
        "application/x-ms-wms",
        "application/x-ms-wmp",
        "application/asx",
        "audio/x-ms-wma",
        "audio/mpeg"
    ],
    
    Initialize: function () {
        window.removeEventListener ("load", MoonMediaExtension.Initialize, true); 

        gBrowser.addEventListener ("load", MoonMediaExtension.OnDocumentLoaded, true);
        gBrowser.addEventListener("PluginNotFound", function (event) {
            try {
                MoonMediaExtension.OnPluginNotFound (event);
            } catch (e) {
                Components.utils.reportError ("Moonlight Media Player: unable to remove the plugin bar, " + 
                    "possibly unsupported Firefox version: " + e);
            }
        }, true);

        var uri_content_listener = new MoonMediaContentListener;
        uri_content_listener.Register ();

        MoonMediaExtension.DisableConflictingPlugins ();
    },

    FindRootDocument: function (in_doc) {
        // Find the root document (walking up in case of frames)
        var doc = in_doc;
        while (doc.defaultView.frameElement) {
            doc = doc.defaultView.frameElement.ownerDocument;
        }
        return doc;
    },
       
    OnDocumentLoaded: function (event) {
        if (!(event.originalTarget instanceof HTMLDocument)) {
            return;
        }
        
        var doc = MoonMediaExtension.FindRootDocument (event.originalTarget);
        var binder = null;
        
        for (var i = 0, n = doc.embeds.length; i < n; i++) {
            if (MoonMediaExtension.SupportedMimeTypes.indexOf (doc.embeds[i].type) >= 0) {
                if (!binder) {
                    MoonMediaExtension.LoadScriptModule ("chrome://moon-media/content/moon-media-binder.js");
                    binder = new MoonMediaBinder ();
                }
                
                binder.LoadEmbed (doc, doc.embeds[i]);
            }
        }
    },
    
    OnPluginNotFound: function (event) {
        // This is a shameful hack that undoes the notification box that gets shown.
        // The code to resolve the browser and thus the notification box and list
        // of missing plugins (so we don't brute-force remove the box) is based on
        // browser/base/content/browser.js (missingPluginInstaller.newMissingPlugin)
        
        var tabbrowser = getBrowser ();
        const browsers = tabbrowser.mPanelContainer.childNodes;

        var content_window = event.target.ownerDocument.defaultView.top;

        var i = 0;
        for (; i < browsers.length; i++) {
            if (tabbrowser.getBrowserAtIndex (i).contentWindow == content_window) {
                break;
            }
        }

        var browser = tabbrowser.getBrowserAtIndex (i);
        var notification_box = gBrowser.getNotificationBox (browser);
        var notification = notification_box.getNotificationWithValue ("missing-plugins");
        
        // End browser.js thievery, begin our savage ways by removing
        // any plugins in the missing list with a mimetype we support
        
        var count = 0;
        var handled = 0;
        for (var mime_type in browser.missingPlugins) {
            count++;
            if (MoonMediaExtension.SupportedMimeTypes.indexOf (mime_type) >= 0) {
                delete browser.missingPlugins[mime_type];
                handled++;
            }
        }
        
        // Since we are friendly savages, we only hide the notification box
        // if we claim to handle any and all plugins in the missing list
        
        if (count - handled <= 0) {
            notification_box.removeChild (notification);
        }
    },

    DisableConflictingPlugins: function () {
        try {
            Components.classes["@mozilla.org/plugin/host;1"]
                .getService (Components.interfaces.nsIPluginHost)
                .getPluginTags ({})
                .forEach (function (plugin) {
                    if (/totem[^a-z]*gmp/i.test (plugin.filename)) {
                        if (!plugin.disabled) {
                            MoonConsole.Log ("Disabled conflicting Moonlight Media Player plugin: " + plugin.name);
                        }
                        plugin.disabled = true;
                    }
                });
        } catch (e) {
            MoonConsole.Logf (MoonMediaExtension, "Could work with the plugin host service: " + e.message);
        }
    },
    
    js_loader: null,
    js_modules_loaded: {},
    
    LoadScriptModule: function (uri, allow_reload) {
        if (MoonMediaExtension.js_modules_loaded[uri]) {
            return;
        }
    
        if (MoonMediaExtension.js_loader == null) {
            MoonMediaExtension.js_loader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                .getService (Components.interfaces.mozIJSSubScriptLoader);
        }
        
        if (!allow_reload) {
            MoonMediaExtension.js_modules_loaded[uri] = true;
        }
        
        MoonMediaExtension.js_loader.loadSubScript (uri); 
    }
}

window.addEventListener ("load", MoonMediaExtension.Initialize, true);

