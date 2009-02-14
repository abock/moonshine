/* Moonshine website magic */

$(document).ready(function () {

  //prepare the install button
  $("#moonlight-banner, #install-host").remove();
  $("#install-buttons").append("<div id='button32'></div><div id='button64'></div>");
  $("#button32, #button64").addClass('install-button').css('opacity','.8').alphaHover(1000,'.8');


  $('a').colorHover(500,'#f57900','#ffffff');
  $(".screenshots a").fancybox();
  $(".screenshots>div>div").rgbaHover(1000,'rgba(0,0,0,.2)','rgba(100,100,100,.2)');
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
  
    $.fn.rgbaHover = function (animtime,fromColor,toColor) { //link hovers color
    $(this).hover(function () {
      return $(this).css('background-color',fromColor).stop().animate({'background-color': toColor},animtime);
    }, function () {
      return $(this).stop().animate({'background-color': fromColor},animtime);
    });
  }
}) (jQuery);
