function MtkLabel (settings) {
    MtkXaml.call (this, MtkStyle.GetDefaultTextBlockXaml (), settings);
   
   this.MapProperties ([ 
        [ "Text", "QueueResize" ], 
        [ "FontFamily", "QueueResize" ],
        [ "FontSize", "QueueResize" ], 
        [ "FontStretch", "QueueResize" ],
        [ "FontStyle", "QueueResize" ],
        [ "FontWeight", "QueueResize" ],
        [ "TextWrapping", "QueueResize" ],
        [ "TextDecorations", "QueueResize" ]
    ]); 

    if (typeof settings == "string") {
        this.Text = settings;
    }

    // Override default XAlign = 0.5
    this.XAlign = 0.0;

    this.AfterConstructed ();
}

