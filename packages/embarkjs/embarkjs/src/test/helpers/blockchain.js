const async = require('async');
const http = require('http');
const net = require('net');
const Web3 = require('web3');

const startRPCMockServer = (options = {}, callback) => {
  const opts = Object.assign({}, {
    successful: true
  }, options);

  let port = 0;
  let sock = net.createServer();
  let state = { visited: false };
  let server = http.createServer((req, res) => {
    state.visited = true;
    if(!opts.successful) {
      res.statusCode = 500;
      return res.end();
    }

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      const request = JSON.parse(body);
      const accountsResponse = JSON.stringify({
        jsonrpc: "2.0",
        id: request.id,
        result: 1337
      });

      res.writeHead(200, {
        'Content-Length': Buffer.byteLength(accountsResponse),
        'Content-Type': 'application/json'
      });
      res.end(accountsResponse);
    });
  });

  async.waterfall([
    cb => { sock.listen(0, cb); },
    cb => { port = sock.address().port; cb(); },
    cb => { sock.close(cb); },
    cb => { server.listen(port, '127.0.0.1', () => cb()); }
  ], () => {
    state.server = server;
    state.connectionString = `http://localhost:${port}`;
    callback(null, state);
  });
};

const TestProvider = {};

TestProvider.init = function(_config) {
  this.web3 = global.web3 || new Web3();
  global.web3 = global.web3 || this.web3;
};

TestProvider.getInstance = function () {
  return this.web3;
};

TestProvider.getAccounts = function () {
  return this.web3.eth.getAccounts(...arguments);
};

TestProvider.getNewProvider = function (providerName, ...args) {
  return new Web3.providers[providerName](...args);
};

TestProvider.setProvider = function (provider) {
  return this.web3.setProvider(provider);
};

TestProvider.getCurrentProvider = function () {
  return this.web3.currentProvider;
};

TestProvider.getDefaultAccount = function () {
  return this.web3.eth.defaultAccount;
};

TestProvider.setDefaultAccount = function (account) {
  this.web3.eth.defaultAccount = account;
};

TestProvider.newContract = function (options) {
  return new this.web3.eth.Contract(options.abi, options.address);
};

TestProvider.send = function () {
  return this.web3.eth.sendTransaction(...arguments);
};

TestProvider.toWei = function () {
  return this.web3.toWei(...arguments);
};

TestProvider.getNetworkId = function () {
  return this.web3.eth.net.getId();
};

module.exports = {
  TestProvider,
  startRPCMockServer
};
