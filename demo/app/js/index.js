$(document).ready(function() {

  $("button.set").click(function() {
    var value = parseInt($("input.text").val(), 10);
    SimpleStorage.set(value);
    addToLog("SimpleStorage.set("+value+")");
  });

  document.getElementsByClassName("get")[0].addEventListener('click', function() {
    var value = SimpleStorage.get().toNumber();
    $(".value").html(value);
    addToLog("SimpleStorage.get()");
  });

  var addToLog = function(txt) {
    $(".logs").append("<br>" + txt);
  }

});
