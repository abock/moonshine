<?php
    $page_meta = array (
        "title" => "Download",
        "page-heading" => "Download"
    );
    require_once('inc/header.inc.php');
?>

<div id="main_container">

  
  <h2 class="clear">Install the Desktop Player</h2>

  <div class="columns">
    <p class="twocolumn">In addition to the Browser Plugin above for viewing content on the web, Moonshine 
    offers a Firefox-based Desktop Player to allow you to play Windows Media content on your local computer.</p>

    <p class="twocolumn">Currently this must be installed from source. The source code also builds the browser plugin, so
    if you build Moonshine from source, you do not need to install the plugin through Firefox using
    the above download links.</p>
  </div>

  <ul class="clear">
     <li class="download"><a href="releases/moonshine-0.2.tar.bz2">Moonshine v0.2 Source Tarball</a></li>
  </ul>



  <h2>Source Code</h2>

  <ul>
  <li>Moonshine is licensed under the MIT/X11 open source license.</li>
  <li>Maintained in GIT: <code>git clone git://github.com/abock/moonshine.git</code></li>
  <li><a href="http://github.com/abock/moonshine/tree/master">View Source (github)</a></li>
  </ul>
  
</div><!--main_container-->

<?php require_once('inc/footer.inc.php'); ?> 
