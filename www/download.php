<?php
  //HEADER
  $page_title = "Moonshine";
  require_once('inc/header.inc.php');

?>

<div class="pageheading">
  <div>
    <h1>Downloads</h1>
  </div>
</div>

<div id="main_container">

  <div class="twocolumn">
    <h2>Source package</h2>
    <p>Download page</p>
  </div>
  
  <div class="twocolumn">
    <h2>Linux Distributions</h2>

    <p>FIXME</p>
  </div>
  
  <h2 class="clear">Install the Desktop Player</h2>

  <div>
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

<?php
  //FOOTER
  require_once('inc/footer.inc.php');  
?> 
