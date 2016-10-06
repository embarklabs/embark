/*globals $, SimpleStorage, document*/

var addToLog = function(txt) {
  $(".logs").append("<br>" + txt);
};

$(document).ready(function() {

  $("button.set").click(function() {
    var value = parseInt($("input.text").val(), 10);
    SimpleStorage.set(value);
    addToLog("SimpleStorage.set(" + value + ")");
  });

  $("button.get").click(function() {
    SimpleStorage.get().then(function(value) {
      $(".value").html(value.toNumber());
    });
    addToLog("SimpleStorage.get()");
  });

});
