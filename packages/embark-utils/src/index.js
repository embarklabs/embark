const {canonicalHost, defaultCorsHost, defaultHost, dockerHostSwap, isDocker} = require('./host');

const Utils = {
  joinPath: function() {
    const path = require('path');
    return path.join.apply(path.join, arguments);
  },
  canonicalHost,
  defaultCorsHost,
  defaultHost,
  dockerHostSwap,
  isDocker
};

module.exports = Utils;
