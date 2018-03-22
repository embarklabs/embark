/*globals $, SimpleStorage, document*/

import React, { Component } from 'react';
import EmbarkJS from 'Embark/EmbarkJS';
import SimpleStorage from 'Embark/contracts/SimpleStorage';
import Test from 'Embark/contracts/Test';
import Assert from 'Embark/contracts/Assert';

import ReactDOM from 'react-dom';

//import $ from './_vendor/jquery.min';
import $ from 'jquery';
//import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap/dist/css/bootstrap-theme.css';
//import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.min.js';

//import 'react-bootstrap/dist/react-bootstrap.min.js';

import { Navbar, Jumbotron, Button } from 'react-bootstrap';

window.EmbarkJS = EmbarkJS;
window.SimpleStorage = SimpleStorage;
window.Test = Test;
window.Assert = Assert;

window.React = React;

import './foo.css';

import App from './app.js';

ReactDOM.render(<App />, document.getElementById('root'));

var addToLog = function(id, txt) {
  $(id + " .logs").append("<br>" + txt);
};

// ===========================
// Blockchain example
// ===========================
$(document).ready(function() {
  console.log([1,2,3].map(v => v + 1));

  $("#blockchain button.set").click(function() {
    var value = parseInt($("#blockchain input.text").val(), 10);

    // If web3.js 1.0 is being used
    if (EmbarkJS.isNewWeb3()) {
      SimpleStorage.methods.set(value).send({from: web3.eth.defaultAccount, gas: 5300000});
      addToLog("#blockchain", "SimpleStorage.methods.set(value).send({from: web3.eth.defaultAccount, gas: 5300000})");
    } else {
      SimpleStorage.set(value);
      addToLog("#blockchain", "SimpleStorage.set(" + value + ")");
    }

  });

  $("#blockchain button.get").click(function() {
    // If web3.js 1.0 is being used
    if (EmbarkJS.isNewWeb3()) {
      SimpleStorage.methods.get().call(function(err, value) {
        $("#blockchain .value").html(value);
      });
      addToLog("#blockchain", "SimpleStorage.methods.get(console.log)");
    } else {
      SimpleStorage.get().then(function(value) {
        $("#blockchain .value").html(value.toNumber());
      });
      addToLog("#blockchain", "SimpleStorage.get()");
    }
  });

});

// ===========================
// Storage (IPFS) example
// ===========================
$(document).ready(function() {
  // automatic set if config/storage.json has "enabled": true and "provider": "ipfs"
  //EmbarkJS.Storage.setProvider('ipfs',{server: 'localhost', port: '5001'});

  $("#storage .error").hide();
  //EmbarkJS.Storage.ipfsConnection.version()
  //  .then(function(){
        $("#status-storage").addClass('status-online');
        $("#storage-controls").show();
   // })
   // .catch(function(err) {
   //   if(err){
   //     console.log("IPFS Connection Error => " + err.message);
   //     $("#storage .error").show();
   //     $("#status-storage").addClass('status-offline');
   //     $("#storage-controls").hide();
   //   }
   // });

  $("#storage button.setIpfsText").click(function() {
    var value = $("#storage input.ipfsText").val();
    EmbarkJS.Storage.saveText(value).then(function(hash) {
      $("span.textHash").html(hash);
      $("input.textHash").val(hash);
      addToLog("#storage", "EmbarkJS.Storage.saveText('" + value + "').then(function(hash) { })");
    })
    .catch(function(err) {
      if(err){
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
      if(err){
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
      if(err){
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
    EmbarkJS.Messages.getWhisperVersion(function(err, version) {
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
