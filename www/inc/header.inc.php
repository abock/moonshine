<?php
    $is_home = $_SERVER["PHP_SELF"] == "/index.php";
    $browser_is_ie = strpos ($_SERVER["HTTP_USER_AGENT"], "MSIE") !== false;
?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
  "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
  <head>
    <meta http-equiv="Content-type" content="text/html; charset=utf-8" />
    <title>Moonshine<?php echo isset ($page_meta["title"]) ? " - " . $page_meta["title"] : "" ?></title>
    <link rel="stylesheet" href="inc/style.css" type="text/css" media="screen" title="default stylesheet" charset="utf-8" />
    <link rel="stylesheet" href="inc/fancybox/fancy.css" type="text/css" media="screen" />
    <script type="text/javascript" src="inc/jquery.min.js"></script>
    <script type="text/javascript" src="inc/jquery.color.js"></script>
    <script type="text/javascript" src="inc/fancybox/jquery.fancybox.js"></script>
    <script type="text/javascript" src="inc/fancybox/jquery.pngFix.pack.js"></script>
    <script type="text/javascript" src="inc/moonshine.js"></script>
<?php if (!$browser_is_ie) { ?>
    <!-- custom header font hack using typeface  http://typeface.neocracy.org -->
    <script type="text/javascript" src="inc/typeface.js"></script>
    <script type="text/javascript" src="inc/nirvana_bold.typeface.js"></script>
<?php } ?>
  </head>
  <body>
  
  <div class="navigation<?php if ($is_home) echo " navigation-animation"?>">
    <div>
<?php if (!$is_home) { ?>
      <a href="index.php" class="first"><span class="typeface-js">Home</span></a>
<?php } ?>
      <a href="download.php"><span class="typeface-js">Download</span></a>
      <a href="samples.php"><span class="typeface-js">Samples</span></a>
      <a href="faq.php"><span class="typeface-js">FAQ</span></a>
    </div>
  </div>
  
<?php if (isset ($page_meta["page-heading"])) { ?>
  <div class="pageheading">
    <div>
      <h1><?php echo $page_meta["page-heading"]?></h1>
    </div>
  </div>
<?php } ?>
