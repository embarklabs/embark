var colors = require('colors');

var Logger = {
  logLevel: 'info',

  info: function(txt) {
    console.log(txt.blue);
  },

  log: function(txt) {
    console.log(txt);
  },

  warn: function(txt) {
    console.log(txt.yellow);
  },

  error: function(txt) {
    console.log(txt.red);
  }

};

module.exports = Logger;
