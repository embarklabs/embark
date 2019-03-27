const http = require('follow-redirects').http;
const https = require('follow-redirects').https;

const {canonicalHost, defaultCorsHost, defaultHost, dockerHostSwap, isDocker} = require('./host');

function checkIsAvailable(url, callback) {
  const protocol = url.split(':')[0];
  const httpObj = (protocol === 'https') ? https : http;

  httpObj.get(url, function (_res) {
    callback(true);
  }).on('error', function (_res) {
    callback(false);
  });
}

const Utils = {
  joinPath: function() {
    const path = require('path');
    return path.join.apply(path.join, arguments);
  },
  canonicalHost,
  defaultCorsHost,
  defaultHost,
  dockerHostSwap,
  isDocker,
  checkIsAvailable
};

module.exports = Utils;
