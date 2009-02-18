/* Moonshine website magic */

$(document).ready(function () {

  //prepare the install button
  $("#moonlight-banner, #install-host").remove();
  $("#install-buttons").append("<div id='install-button'></div>");
  //add an emblem of the platform 
  var user_agent = navigator.userAgent.toLowerCase ();
  //console.log(user_agent);
  var platforms = {'suse':'suse', 
                   'sled':'suse',
                   'mac':'mac', 
                   'ubuntu':'ubuntu', 
                   'mandriva':'mandriva', 
                   'fedora':'fedora'};
  for (x in platforms) {
      if (user_agent.match(x)) {
        $('#install-button').append("<div class='" + platforms[x] + " distro'></div>").click(function () {
          //do shit
        }).mousedown(function() {
          //move the emblem along ;)
          $('#install-button .distro').css('top','25px');
        }).mouseup(function () {
          var top = $('#install-button .distro').css('top');
          $('#install-button .distro').css('top','23px');
        });
      }
  }
  
  //link hovers animated
  $('a').colorHover(500,'#f57900','#ffffff');
  //screenshots
  $(".screenshots a").fancybox();
  //slide in navigation
  $(".navigation-animation").css("top","-40px").animate({top: '12px'},2000);
});


(function($){
  $.fn.colorHover = function (animtime,fromColor,toColor) { //link hovers color
    $(this).hover(function () {
      return $(this).css('color',fromColor).stop().animate({'color': toColor},animtime);
    }, function () {
      return $(this).stop().animate({'color': fromColor},animtime);
    });
  }
  
  $.fn.alphaHover = function (animtime,fromAlpha) { //link hovers color
    $(this).hover(function () {
      return $(this).css('opacity',fromAlpha).stop().animate({'opacity': '1'},animtime);
    }, function () {
      return $(this).stop().animate({'opacity': fromAlpha},animtime);
    });
  }
  
}) (jQuery);
