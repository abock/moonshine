function MtkMediaElement (settings) {
    MtkWidget.call (this, settings);
    this.InitFromXaml ("<MediaElement/>");
    this.AfterConstructed ();
}

