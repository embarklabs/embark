/*global web3*/
import EmbarkJS from 'Embark/EmbarkJS';
import {SimpleStorage, Test, SimpleStorageTest} from '../../embarkArtifacts/contracts';

window.SimpleStorageTest = SimpleStorageTest;

import $ from 'jquery';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.css';
import 'bootstrap/dist/js/bootstrap.min.js';

window.EmbarkJS = EmbarkJS;
window.SimpleStorage = SimpleStorage;
window.Test = Test;

var addToLog = function(id, txt) {
  $(id + " .logs").append("<br>" + txt);
};

// ===========================
// Blockchain example
// ===========================
$(document).ready(function() {
  EmbarkJS.onReady((err) => {
    if (err) {
      console.error(err);
    }
  });

  $("#blockchain button.set").click(function() {
    var value = parseInt($("#blockchain input.text").val(), 10);

    SimpleStorage.methods.set(value).send({from: web3.eth.defaultAccount, gas: 5300000});
    addToLog("#blockchain", "SimpleStorage.methods.set(value).send({from: web3.eth.defaultAccount, gas: 5300000})");
  });

  $("#blockchain button.get").click(function() {
    SimpleStorage.methods.get().call(function(err, value) {
      $("#blockchain .value").html(value);
    });
    addToLog("#blockchain", "SimpleStorage.methods.get(console.log)");
  });

});

// ===========================
// Storage (IPFS) example
// ===========================
$(document).ready(function() {
  $("#storage .error").hide();
  $("#status-storage").addClass('status-online');
  $("#storage-controls").show();

  $("#storage button.setIpfsText").click(function() {
    var value = $("#storage input.ipfsText").val();
    EmbarkJS.Storage.saveText(value).then(function(hash) {
      $("span.textHash").html(hash);
      $("input.textHash").val(hash);
      addToLog("#storage", "EmbarkJS.Storage.saveText('" + value + "').then(function(hash) { })");
    })
      .catch(function(err) {
        if (err) {
          console.log("IPFS saveText Error => " + err.message);
        }
      });
  });

  $("#storage button.loadIpfsHash").click(function() {
    var value = $("#storage input.textHash").val();
    EmbarkJS.Storage.get(value).then(function(content) {
      $("span.ipfsText").html(content);
      addToLog("#storage", "EmbarkJS.Storage.get('" + value + "').then(function(content) { })");
    })
      .catch(function(err) {
        if (err) {
          console.log("IPFS get Error => " + err.message);
        }
      });
  });

  $("#storage button.uploadFile").click(function() {
    var input = $("#storage input[type=file]");
    EmbarkJS.Storage.uploadFile(input).then(function(hash) {
      $("span.fileIpfsHash").html(hash);
      $("input.fileIpfsHash").val(hash);
      addToLog("#storage", "EmbarkJS.Storage.uploadFile($('input[type=file]')).then(function(hash) { })");
    })
      .catch(function(err) {
        if (err) {
          console.log("IPFS uploadFile Error => " + err.message);
        }
      });
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
  $("#communication .errorVersion").hide();
  if (EmbarkJS.Messages.providerName === 'whisper') {
    EmbarkJS.Messages.getWhisperVersion(function(err, _version) {
      if (err) {
        $("#communication .error").show();
        $("#communication-controls").hide();
        $("#status-communication").addClass('status-offline');
      } else {
        EmbarkJS.Messages.setProvider('whisper');
        $("#status-communication").addClass('status-online');
      }
    });
  }

  $("#communication button.listenToChannel").click(function() {
    var channel = $("#communication .listen input.channel").val();
    $("#communication #subscribeList").append("<br> subscribed to " + channel + " now try sending a message");
    EmbarkJS.Messages.listenTo({topic: [channel]}).subscribe(function({data: message}) {
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

// ===========================
// Namesystem (ENS) example
// ===========================
$(document).ready(function () {
  EmbarkJS.onReady(async () => {
    $("#namesystem .error").hide();
    let error = null, isAvailable = false;
    try {
      if (!EmbarkJS.Names.currentNameSystems) {
        throw new Error("Please set a provider using e.g. 'EmbarkJS.Names.setProvider(\"ens\")'");
      }
      addToLog("#namesystem", "EmbarkJS.Names.setProvider('ens')");
      await EmbarkJS.Names.currentNameSystems.waitForProviderReady();
      isAvailable = EmbarkJS.Names.isAvailable();
    } catch (err) {
      error = err;
    }
    finally {
      if (error || !isAvailable) {
        $("#namesystem .not-enabled").show();
        $("#namesystem .error").text(error).show();
        $("#namesystem-controls").hide();
        $("#status-namesystem").addClass('status-offline');
      } else {
        $("#status-namesystem").addClass('status-online');
        $("#namesystem .not-enabled").hide();

        $("#namesystem .resolve .error").hide();
        $("#namesystem .resolve .success").hide();
        $("#namesystem .resolve input").val(EmbarkJS.Names.currentNameSystems.registration.rootDomain);

        $("#namesystem .lookup .error").hide();
        $("#namesystem .lookup .success").hide();
        $("#namesystem .lookup input").val(web3.eth.defaultAccount);

        $("#namesystem .register .error").hide();
        $("#namesystem .register .success").hide();
        $("#namesystem .register input.address").val(web3.eth.defaultAccount);
      }
    }

    $("#namesystem .resolve button").click(function () {
      $("#namesystem .resolve .error").hide();
      $("#namesystem .resolve .success").hide();
      var resolveName = $("#namesystem .resolve input").val();
      EmbarkJS.Names.resolve(resolveName, (err, result) => {
        if (err) {
          return $("#namesystem .resolve .error").text(err).show();
        }
        $("#namesystem .resolve .success").text(result).show();
      });
      addToLog("#namesystem", `EmbarkJS.Names.resolve('${resolveName}', console.log)`);
    });

    $("#namesystem .lookup button").click(function () {
      $("#namesystem .lookup .error").hide();
      $("#namesystem .lookup .success").hide();
      var lookupName = $("#namesystem .lookup input").val();
      EmbarkJS.Names.lookup(lookupName, (err, result) => {
        if (err) {
          return $("#namesystem .lookup .error").text(err).show();
        }
        $("#namesystem .lookup .success").text(result).show();
      });
      addToLog("#namesystem", `EmbarkJS.Names.lookup('${lookupName}', console.log)`);
    });

    $("#namesystem .register button").click(function () {
      $("#namesystem .register .error").hide();
      $("#namesystem .register .success").hide();
      var registerName = $("#namesystem .register input.name").val();
      var registerAddress = $("#namesystem .register input.address").val();
      EmbarkJS.Names.registerSubDomain(registerName, registerAddress, (err, transaction) => {
        if (err) {
          return $("#namesystem .register .error").text(err).show();
        }
        $("#namesystem .register .success").text(`Successfully registered "${registerAddress}" with ${transaction.gasUsed} gas`).show();
      });
      addToLog("#namesystem", `EmbarkJS.Names.registerSubDomain('${registerName}', '${registerAddress}', console.log)`);
    });
  });
});
