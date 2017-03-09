/*globals $, SimpleStorage, document*/

var addToLog = function(id, txt) {
  $(id + " .logs").append("<br>" + txt);
};

// ===========================
// Blockchain example
// ===========================
$(document).ready(function() {

  $("#blockchain button.set").click(function() {
    var value = parseInt($("#blockchain input.text").val(), 10);
    SimpleStorage.set(value);
    addToLog("#blockchain", "SimpleStorage.set(" + value + ")");
  });

  $("#blockchain button.get").click(function() {
    SimpleStorage.get().then(function(value) {
      $("#blockchain .value").html(value.toNumber());
    });
    addToLog("#blockchain", "SimpleStorage.get()");
  });

});

// ===========================
// Storage (IPFS) example
// ===========================
$(document).ready(function() {
  // automatic set if config/storage.json has "enabled": true and "provider": "ipfs"
  //EmbarkJS.Storage.setProvider('ipfs',{server: 'localhost', port: '5001'});

  $("#storage .error").hide();
  EmbarkJS.Storage.ipfsConnection.ping()
    .then(function(){
        $("#status-storage").addClass('status-online');
        $("#storage-controls").show();
    })
    .catch(function(err) {
      if(err){
        console.log("IPFS Connection Error => " + err.message);
        $("#storage .error").show();
        $("#status-storage").addClass('status-offline');
        $("#storage-controls").hide();
      }
  });

  $("#storage button.setIpfsText").click(function() {
    var value = $("#storage input.ipfsText").val();
    EmbarkJS.Storage.saveText(value).then(function(hash) {
      $("span.textHash").html(hash);
      $("input.textHash").val(hash);
    });
    addToLog("#storage", "EmbarkJS.Storage.saveText('" + value + "').then(function(hash) { })");
  });

  $("#storage button.loadIpfsHash").click(function() {
    var value = $("#storage input.textHash").val();
    EmbarkJS.Storage.get(value).then(function(content) {
      $("span.ipfsText").html(content);
    });
    addToLog("#storage", "EmbarkJS.Storage.get('" + value + "').then(function(content) { })");
  });

  $("#storage button.uploadFile").click(function() {
    var input = $("#storage input[type=file]");
    EmbarkJS.Storage.uploadFile(input).then(function(hash) {
      $("span.fileIpfsHash").html(hash);
      $("input.fileIpfsHash").val(hash);
    });
    addToLog("#storage", "EmbarkJS.Storage.uploadFile($('input[type=file]')).then(function(hash) { })");
  });

  $("#storage button.loadIpfsFile").click(function() {
    var hash = $("#storage input.fileIpfsHash").val();
    var url = EmbarkJS.Storage.getUrl(hash);
    var link = '<a href="' + url + '" target="_blank">' + url + '</a>';
    $("span.ipfsFileUrl").html(link);
    $(".ipfsImage").attr('src', url);
    addToLog("#storage", "EmbarkJS.Storage.getUrl('" + hash + "')");
  });

});

// ===========================
// Communication (Whisper) example
// ===========================
$(document).ready(function() {

  $("#communication .error").hide();
  web3.version.getWhisper(function(err, res) {
    if (err) {
      $("#communication .error").show();
      $("#communication-controls").hide();
+     $("#status-communication").addClass('status-offline');
    } else {
      EmbarkJS.Messages.setProvider('whisper');
      $("#status-communication").addClass('status-online');
    }
  });

  $("#communication button.listenToChannel").click(function() {
    var channel = $("#communication .listen input.channel").val();
    $("#communication #subscribeList").append("<br> subscribed to " + channel + " now try sending a message");
    EmbarkJS.Messages.listenTo({topic: [channel]}).then(function(message) {
      $("#communication #messagesList").append("<br> channel: " + channel + " message: " + message);
    });
    addToLog("#communication", "EmbarkJS.Messages.listenTo({topic: ['" + channel + "']}).then(function(message) {})");
  });

  $("#communication button.sendMessage").click(function() {
    var channel = $("#communication .send input.channel").val();
    var message = $("#communication .send input.message").val();
    EmbarkJS.Messages.sendMessage({topic: channel, data: message});
    addToLog("#communication", "EmbarkJS.Messages.sendMessage({topic: '" + channel + "', data: '" + message + "'})");
  });

});
