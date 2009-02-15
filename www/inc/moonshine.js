/* Moonshine website magic */

$(document).ready(function () {

  //prepare the install button
  $("#moonlight-banner, #install-host").remove();


  $('a').colorHover(500,'#f57900','#ffffff');
  $(".screenshots a").fancybox();
  $(".navigation").css("top","-40px").animate({top: '12px'},2000);
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
