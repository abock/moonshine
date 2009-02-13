<?php
  //HEADER
  $page_title = "Moonshine";
  require_once('inc/header.inc.php');
  print "<h1>${page_title}</h1>";
?>

<h3 class="tagline"><em>Windows Media playback through Moonlight and Firefox for Linux</em></h3>

<p>With Moonshine you can...</p>

<ul class="intro-list">
  <li><p>View embedded Windows Media content in Firefox</p></li>

  <li><p>Play local Windows Media content on your Desktop</p></li>
  <li><p><em>Do it all without worrying about where to get the codec</em></p></li>
</ul>

<h2>Easy Multimedia</h2>
<p>
Moonshine leverages the Windows Media capabilities from <a href="http://silverlight.net/">Silverlight</a>,
provided by the <a href="http://go-mono.com/moonlight">Moonlight</a> browser plugin on Linux, 
and the <a href="http://www.firefox.com/">Firefox</a> web 
browser framework to enable the playback of embedded Windows 
Media content on the web and local files on a user's desktop.
</p>

<h2>Install the Browser Plugin</h2>

<p id="moonlight-banner">Moonshine requires the <a href="http://go-mono.com/moonlight">Moonlight plugin</a>. 
Before installing Moonshine, please <a href="http://go-mono.com/moonlight/">install Moonlight</a>.</p>

<div id="install-host">
<p>Moonshine requires Firefox 3.0 or newer and JavaScript to be enabled in your browser. If you are
seeing this message, it is likely that Moonshine will not run properly.</p>

</div>


<p style="margin-top: 2em">After you've installed Moonshine, try <a href="http://c-span.com/Watch/C-SPAN_wm.aspx">testing it out at C-SPAN</a>.</p>

<h2>Install the Desktop Player</h2>

<p>In addition to the Browser Plugin above for viewing content on the web, Moonshine 
offers a Firefox-based Desktop Player to allow you to play Windows Media content on your local computer.</p>

<p>Currently this must be installed from source. The source code also builds the browser plugin, so
if you build Moonshine from source, you do not need to install the plugin through Firefox using
the above download links.</p>

<ul>
<li><a href="releases/moonshine-0.2.tar.bz2">Moonshine v0.2 Source Tarball</a></li>
</ul>

<h2>Why?</h2>

<p>
While Flash is now the typical format for delivering streaming video
over the web these days, lots of content still exists that requires
an additional browser plugin to view the media. Historically, this
content has not been well supported on Linux. Moonshine aims to fill
this gap by leveraging the Moonlight plugin, otherwise known as 
<em>Silverlight for Linux</em>.
</p>

<h2>How?</h2>

<p>
Moonshine is a browser plugin that proxies the Moonlight plugin, 
claiming support for Windows Media content. When Firefox comes across
content advertised as Windows Media, it loads the Moonshine plugin
which in turn loads Moonlight.
</p>

<p>
Moonshine then loads its media player application, written in Silverlight,
into the proxied Moonlight plugin, which is able to play back the 
Windows Media content.
</p>

<p>
The desktop player is Firefox with the standard web chrome replaced with 
controls to drive the media experience.
</p>

<h2>What about the Codec?</h2>

<p>
Windows Media support is included in Moonlight, and is provided directly
by Microsoft as part of their commitment to Silverlight compatibility
on all platforms. Moonshine simply leverages this support by loading
a Silverlight media player application into the browser for Moonlight
to run.

</p>

<h2>Source Code</h2>

<ul>
<li>Moonshine is licensed under the MIT/X11 open source license.</li>
<li>Maintained in GIT: <code>git clone git://github.com/abock/moonshine.git</code></li>
<li><a href="http://github.com/abock/moonshine/tree/master">View Source (github)</a></li>
</ul>

<h2>Trivia</h2>

<ul>
<li>The Moonshine player is written entirely in JavaScript as a Silverlight application</li>
<li>The Plugin is written in C, uses GLib, and implements NPAPI to proxy Moonlight</li>
<li>The Desktop Player Shell is written in JavaScript/XUL</li>
</ul>

<ul>
<li><p>Moonshine was developed by <a href="http://abock.org/">Aaron Bockover</a>, and would not be 
possible without all the hard effort from the awesome guys on the Novell 
<a href="http://go-mono.com/moonlight">Moonlight</a> team.</p></li>

<li><p><a href="http://tirania.org/blog">Miguel de Icaza</a> insists on calling Moonshine &quot;Pornilus,&quot;
a homage to an ancient Roman senator and patron of the arts from the 3rd century. 
He further insists he is <em>awesome</em> because of this historical connection.</p></li>
</ul>


<?php
  //FOOTER
  require_once('inc/footer.inc.php');  
?> 
