//
// This file is licensed under the MIT X11 open source license.
// http://www.opensource.org/licenses/mit-license.php
//
// Authors: Aaron Bockover <abockover@novell.com>
//
// Copyright 2009 Novell, Inc.
// 

function MtkLabel (settings) {
   MtkXaml.call (this, "<TextBlock/>", settings);
   
   this.CustomSize = false;
   this.CustomForeground = false;
   this.CustomFamily = false;
   
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
        if (!this.CustomFamily) this.FontFamily = MtkStyle.Font.Family;
        if (!this.CustomSize) this.FontSize = MtkStyle.Font.Size;
        if (!this.CustomForeground) this.Foreground = MtkStyle.GetColor ("window_fg"); 
    });

    // Override default XAlign = 0.5
    this.XAlign = 0.0;

    this.AfterConstructed ();
}

