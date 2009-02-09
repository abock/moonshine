//
// This file is licensed under the MIT X11 open source license.
// http://www.opensource.org/licenses/mit-license.php
//
// Authors: Aaron Bockover <abockover@novell.com>
//
// Copyright 2009 Novell, Inc.
// 

function MtkToolBar (settings) {
    this.XamlInitSource = '<Canvas/>';
    MtkHBox.call (this, settings);

    this.Spacing = 3;
    this.Padding = 3;

    this.Override ("OnStyleSet", function () {
        this.Xaml.Background = MtkStyle.CreateGradient (this, "window_bg");
    });

    this.AfterConstructed ();
}

