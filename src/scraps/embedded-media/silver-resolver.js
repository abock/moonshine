function Log (x)
{
    if (console != null) {
        console.log (x);
    }
}

function TestSilverlightObject (o)
{
    return o != null && o.settings != null;
}

function FindSilverlightObject (id)
{
    // First try to find it directly by ID (only the <embed> tag was used)
    var embed_object = document.getElementById (id);
    if (TestSilverlightObject (embed_object)) {
        Log ("Found silverlight object directly by ID");
        return embed_object
    }

    var parent_object = null;
    
    if (embed_object == null) {
        // We do not have an ID or it cannot be resolved so set the document
        // as the <embed> search target. Likely simply means the DOM is generated
        // by the browser (media file opened directly in the browser, no HTML)
        parent_object = document;
        Log ("Nothing found by ID, searching entire DOM for <embed> silverlight object");
    } else {
        // We have an IDed element, but it's not a Silverlight object so set this
        // element as the search target for an <embed>, which is solves this problem:
        // <object id="foo">
        //  <embed id="foo"></embed>
        // </object>
        parent_object = embed_object;
        Log ("Found by ID, but it's not silverlight, so searching it for <embed> silverlight object");
    }

    embed_object = parent_object.getElementsByTagName ("embed");
    if (embed_object != null && embed_object.length > 0) {
        embed_object = embed_object[0];
    } else {
        embed_object = null;
    }

    if (TestSilverlightObject (embed_object)) {
        Log ("Found silverlight object in the DOM by getElementsByTagName");
        return embed_object;
    }

    Log ("Could not find a silverlight object to attach to");
    return null;
}

