function MtkLabel (settings) {
    MtkXaml.call (this, "<TextBlock/>", settings);
   
   this.MapProperties ([ 
        [ "Text", "QueueResize" ], 
        [ "FontFamily", "QueueResize" ],
        [ "FontSize", "QueueResize" ], 
        [ "FontStretch", "QueueResize" ],
        [ "FontStyle", "QueueResize" ],
        [ "FontWeight", "QueueResize" ],
        [ "TextWrapping", "QueueResize" ],
        [ "TextDecorations", "QueueResize" ],
        [ "Foreground" ]
    ]); 

    if (typeof settings == "string") {
        this.Text = settings;
    }
    
    this.Override ("OnStyleSet", function () {
        this.FontFamily = MtkStyle.Font.Family;
        this.FontSize = MtkStyle.Font.Size;
        this.Foreground = MtkColor.ToString (MtkStyle.Colors.window_fg.normal);
    });

    // Override default XAlign = 0.5
    this.XAlign = 0.0;

    this.AfterConstructed ();
}

