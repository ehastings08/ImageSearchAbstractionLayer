$(function() {
  console.log('hello world :o');
  
  $.get("/api/imagesearch/:q", function(return_values) {
    return_values.forEach(function(value) {
      $('<li></li>').text(value).appendTo('ul#value');
    });
  });

});