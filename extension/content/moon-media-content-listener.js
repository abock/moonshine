function MoonMediaContentListener () {
    this.className = "MoonMediaContentListener";
}

MoonMediaContentListener.prototype = {

    loadCookie: null,
    parentContentListener: null,

    Register: function () {
        var uri_loader = Components.classes["@mozilla.org/uriloader;1"]
            .getService (Components.interfaces.nsIURILoader);
        uri_loader.registerContentListener (this);
    },
    
    QueryInterface: function (iid) {
        if (iid.equals (Components.interfaces.nsIURIContentListener) ||
            iid.equals (Components.interfaces.nsISupportsWeakReference) ||
            iid.equals (Components.interfaces.nsISupports)) {
            return this;
        }

        throw Components.results.NS_NOINTERFACE;
    },

    onStartURIOpen: function (uri) {
        MoonConsole.Logf (this, uri.spec);
        return this.parentContentListener ? this.parentContentListener.onStartURIOpen (uri) : false;
    },

    doContent: function (contentType, isContentPreferred, request, contentHandler) {
        MoonConsole.Logfa.apply (this, arguments);

        var loaded_doc = null;
        var loaded_win = null;

        try {
            var interface_requestor = request.notificationCallbacks.QueryInterface (
                Components.interfaces.nsIInterfaceRequestor);
            loaded_win = interface_requestor.getInterface (Components.interfaces.nsIDOMWindow);
            loaded_doc = MoonMediaExtension.FindRootDocument (loaded_win.document);
        } catch (e) {
            MoonConsole.Log ("nsIRequest is not bound to an nsIDOMWindow for URI: " 
                + request.URI.spec);
        }

        if (!loaded_doc) {
            loaded_win = gBrowser.mCurrentBrowser;
            loaded_doc = MoonMediaExtension.FindRootDocument (gBrowser.mCurrentBrowser.contentDocument);
        }

        this.CreateEmbeddedForUri (loaded_win, loaded_doc, request.URI.spec);

        return false;
    },

    canHandleContent: function (contentType, isContentPreferred, desiredContentType) {
        MoonConsole.Logfa.apply (this, arguments);
        return this.isPreferred (contentType);
    },

    isPreferred: function (contentType, desiredContentType) {
        MoonConsole.Logfa.apply (this, arguments);
        return MoonMediaExtension.SupportedMimeTypes.indexOf (contentType) >= 0;
    },

    CreateEmbeddedForUri: function (window, document, uri) {
        // Bind to the request URI by creating a new DOM and generating <embed> 
        // against the contentType, which will in turn be translated to Silverlight
        MoonConsole.Logfa.apply (this, arguments);

        document.location = "chrome://moon-media/content/standalone-player.xul?uri=" + encodeURI (uri) + "&controls=hide";
    }
}

