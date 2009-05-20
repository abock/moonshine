$(document).ready (function () {

    var user_agent = navigator.userAgent.toLowerCase ();
    var platforms = {
        "suse":      "openSUSE",
        "sled":      "openSUSE",
        "opensuse":  "openSUSE",
        "osx":       "Mac OS X",
        "ubuntu":    "Ubuntu",
        "mandriva":  "Mandriva",
        "fedora":    "Fedora",
        "foresight": "Foresight",
        "firefox":   "Firefox",
        "generic":   "Source Code"
    };
    
    var platform_id = "generic";
    var platform_name = platforms[platform_id];

    Cufon.replace('h1,h2,h3,.navigation a>span');        
    for (i in platforms) {
        if (user_agent.match (i)) {
            platform_id = i;
            platform_name = platforms[i];
            if (platform_id == "suse" || platform_id == "sled") {
                platform_id = "opensuse";
            }
            break;
        }
    }
    
    $("#moonlight-banner, #install-host").remove ();
    $("#install-buttons").append ("<div id=\"install-button\"></div>");
    $(".install").each (function (i, o) {
        var name = $(o).attr('class').split(' ')[1];
        $(".distro-list").append ("<div class=\"distro-button distro-button-"
            + name + "\"><img src=\"images/distro-logos/48x48/" 
            + name + ".png\" /><p>" + platforms[name] + "</p></div>");
        var button = $(".distro-button-" + name).click (function () {
            if ($(this).hasClass ("chosen")) {
                return;
            }
            
            $(".distro-button").removeClass ("chosen");
            $(".install").hide (300);
            $("." + name).show (300);
            $(this).addClass ("chosen");
        });

        if (name != platform_id) {
            $(o).hide ();
        } else {
            button.addClass ("chosen");
            $(o).css ("opacity", 0).show ().animate ({"opacity": 1}, 1000);
        }
    });
    
    $("#install-button").append ("<div class=\"button-" + platform_id + " distro\"></div>").click (function () {
        window.location = "/download.php";
    }).mousedown (function () {
        $("#install-button .distro").css ("top", "25px");
    }).mouseup (function () {
        var top = $("#install-button .distro").css ("top");
        $("#install-button .distro").css ("top", "23px");
    });
    
    $("a").colorHover (500, "#f57900", "#ffffff");
    $(".screenshots a").fancybox ();
    $(".navigation-animation").css ("top", "-40px").animate ({top: "12px"}, 2000);
});

(function ($) {
    $.fn.colorHover = function (animtime, fromColor, toColor) {
        $(this).hover (function () {
            return $(this).css ("color", fromColor).stop ().animate ({"color": toColor}, animtime);
        }, function () {
            return $(this).stop ().animate ({"color": fromColor}, animtime);
        });
    };
  
    $.fn.alphaHover = function (animtime, fromAlpha) {
        $(this).hover (function () {
            return $(this).css ("opacity", fromAlpha).stop ().animate ({"opacity": "1"}, animtime);
        }, function () {
            return $(this).stop ().animate ({"opacity": fromAlpha}, animtime);
        });
    };
}) (jQuery);

