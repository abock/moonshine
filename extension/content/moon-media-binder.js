function MoonMediaBinder () {
}

MoonMediaBinder.prototype = {
    
    ignore_attrs: [
        "type",
        "width",
        "height",
        "id"
    ],
    
    source_remap_attrs: [
        "source",
        "src",
        "filename",
        "url"
    ],
    
    scripts_to_load: [
        "chrome://moon-media/content/player/player.js",
        "chrome://moon-media/content/player/wmp-controls.js"
    ],
    
    LoadEmbed: function (doc, embed) {
        var parent = embed.parentNode;
        
        // Load player JS into the DOM
        for (var i = 0, n = this.scripts_to_load.length; !this.scripts_loaded && i < n; i++) {
            this.LoadUnsafeScript (doc, this.scripts_to_load[i]);
        }
        this.scripts_to_load = [];

        // Load XAML from the chrome into the HTML DOM
        var xaml = doc.createElement ("script");
        xaml.id = "moon-media-xaml-" + embed.id;
        xaml.type = "text/xaml";
        xaml.appendChild (doc.createTextNode (this.GetFileContents (
            "chrome://moon-media/content/player/player.xaml")));
        
        // Remove the old embed, using the xaml as the new placeholder
        parent.insertBefore (xaml, embed);
        parent.removeChild (embed);

        // Create the silverlight object with the old embed ID
        var silver = doc.createElement ("object");
        silver.type = "application/x-silverlight";
        silver.id = embed.id;
        silver.width = embed.width;
        silver.height = embed.height;
        
        // Add a parameter to the SL object to source in the XAML script        
        this.AppendObjectParameter (doc, silver, "source", "#" + xaml.id);
        this.AppendObjectParameter (doc, silver, "onload", "__MoonMediaPlayerOnLoad");
        
        // Migrate any attributes from the old embed
        var attributes = embed.wrappedJSObject.attributes;
        var embed_source = null;
        
        for (var i = 0, n = attributes.length; i < n; i++) {
            if (this.ignore_attrs.indexOf (attributes[i].name) >= 0) {
                continue;
            } else if (this.source_remap_attrs.indexOf (attributes[i].name) >= 0) {
                embed_source = attributes[i].value;
                continue;
            }
            
            this.AppendObjectParameter (doc, silver, attributes[i].name, attributes[i].value);
        }
        
        if (embed_source != null) {
            this.AppendObjectParameter (doc, silver, "media-source", embed_source);
        }
        
        parent.insertBefore (silver, xaml);
    },
    
    AppendObjectParameter: function (doc, object, name, value) {
        var param = doc.createElement ("param");
        param.name = name;
        param.value = value;
        object.appendChild (param);
    },
    
    LoadUnsafeScript: function (doc, uri) {
        this.LoadUnsafeScriptFromString (doc, this.GetFileContents (uri));
    },
    
    LoadUnsafeScriptFromString: function (doc, contents) {
        var script = doc.createElement ("script");
        script.type = "text/javascript";
        script.appendChild (doc.createTextNode (contents));
        doc.getElementsByTagName ("head")[0].appendChild (script);
    },
    
    GetFileContents: function (url) {
        var ios = Components.classes["@mozilla.org/network/io-service;1"]
            .getService (Components.interfaces.nsIIOService);
        var stream = Components.classes["@mozilla.org/scriptableinputstream;1"]
            .getService (Components.interfaces.nsIScriptableInputStream);
            
        var channel = ios.newChannel (url, null, null);
        var input = channel.open ();
        stream.init (input);
        
        var contents = "";
        var length = channel.contentLength > 0
            ? channel.contentLength
            : input.available ();

        while (contents.length < length) {
            contents += stream.read (length - contents.length);
        }
  
        stream.close ();
        input.close ();
        
        return contents;
    }
}

