<?php
    $page_meta = array (
        "title" => "Download &amp; Install",
        "page-heading" => "Install Moonshine"
    );
    require_once ('inc/header.inc.php');
?>

<p>Moonshine can be installed for your Linux Distribution or just for Firefox as a plugin. 
Linux packages include a Firefox launcher that allows the playback of local media files on your computer.</p>

<div class="download-widget">
  <h2>1. Select Your Distribution</h2>

  <div class="distro-list">
  </div>
  <div class="clear">&nbsp;</div>

  <div class="install opensuse">
  <h2>2. Install on openSUSE</h2>
  <div class="columns">
  <div class="twocolumn">
  
    <div class="columns installbuttons">
      <div class="twocolumn">
        <h4 class="distro">openSUSE 11.1</h4>
        <div><a href="http://download.opensuse.org/repositories/Banshee/openSUSE_11.1/banshee-1.ymp" ><img src="images/1click-install-button.png" alt="1-Click Install for openSUSE 11.1" title="1-Click Install for openSUSE 11.1" /></a></div>
        <div><a href="http://download.opensuse.org/repositories/Banshee/openSUSE_11.1/" title="openSUSE 11.1 Repository">Repository</a></div>
      </div>
      <div class="twocolumn">
        <h4 class="distro">openSUSE 11.0</h4>
        <div><a href="http://download.opensuse.org/repositories/Banshee/openSUSE_11.0/banshee-1.ymp" ><img src="images/1click-install-button.png" alt="1-Click Install for openSUSE 11.0" title="1-Click Install for openSUSE 11.0" /></a></div>
        <div><a href="http://download.opensuse.org/repositories/Banshee/openSUSE_11.0/" title="openSUSE 11.0 Repository">Repository</a></div>
      </div>
    </div>
  </div>

  <div class="twocolumn">
  <strong>Note:</strong> The 1-click install provides the opportunity to automatically subscribe to the repository. 
  If you prefer to install manually from the command line or YaST, subscribe to the appropriate repository to the left and
  install the <code>moonshine</code> package.
  </div>
  </div>
  <div class="clear">&nbsp;</div>
  </div>


  <div class="install foresight">
  <h2>2. Install on Foresight</h2>
  <p>Installing Moonshine is as easy as installing <code>moonshine</code> from PackageKit, 
  or typing <code>sudo conary update moonshine</code> from a terminal.</p>
  </div>


  <div class="install firefox">
  <h2>2. Install the Firefox Plugin</h2>
  <p>The preferred way to install Moonshine is through packages provided by your Linux Distribution. If packages do not
  yet exist for your distribution, or you only care about the browser plugin (not the desktop player), you may install
  Moonshine as a Firefox Extension.</p>
  <p style="margin: 2em 0 0 2em"><a href="#"><img src="images/1click-install-button-ff.png" alt="Install Moonshine for Firefox" title="Install Moonshine for Firefox" /></a></p>
  </div>
    
  <div class="install generic clear">
  <h2>2. Install from Source</h2>
  <div class="columns">
      <div class="twocolumn">
        <p>The preferred way to install Moonshine is through packages provided by your Linux Distribution. 
        If packages are not available, or you only care about the browser plugin (not the desktop player), 
        you may install Moonshine as a Firefox Extension.</p>
        <ul>
         <li class="download"><a href="releases/moonshine-0.2.tar.bz2">Moonshine v0.2 Source Tarball</a></li>
        </ul>
    </div>
    <div class="twocolumn">
      <p>The source code also builds the browser plugin, so
      if you build Moonshine from source, you do not need to install the Firefox Extension.</p>
      
      <ul>
        <li>Moonshine is developed in GIT: <br/> <code style="white-space: nowrap;">git clone git://github.com/abock/moonshine.git</code></li>
        <li><a href="http://github.com/abock/moonshine/tree/master">View Source (github)</a></li>
      </ul>
    </div>
  </div>
</div>

</div><!--main_container-->

<?php require_once ('inc/footer.inc.php'); ?>
