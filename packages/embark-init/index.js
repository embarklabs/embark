/* global exports process require */

require('colors');
const {join} = require('path');
const {promisify} = require('util');

const dappPath = process.env.DAPP_PATH || process.cwd();

exports.init = async ({
  doneMessage = 'init done!'.green,
} = {}) => {
  console.log(doneMessage);
};
