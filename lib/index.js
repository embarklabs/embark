/*jshint esversion: 6 */
var async = require('async');
var Web3 = require('web3');
var fs = require('fs');
var grunt = require('grunt');
var mkdirp = require('mkdirp');
var colors = require('colors');
var chokidar = require('chokidar');

var Cmd = require('./cmd.js');
var Deploy = require('./deploy.js');
var ContractsManager = require('./contracts.js');
var ABIGenerator = require('./abi.js');
var TemplateGenerator = require('./template_generator.js');
var Blockchain = require('./blockchain.js');

var Embark = {

  process: function(args) {
    var cmd = new Cmd(Embark);
    cmd.process(args);
  },

  generateTemplate: function(templateName, destinationFolder, name) {
    var templateGenerator = new TemplateGenerator(templateName);
    templateGenerator.generate(destinationFolder, name);
  },

  initConfig: function(configDir, files, env) {
    this.contractsManager = new ContractsManager(configDir, files, env);
    this.contractsManager.init();
    return this.contractsManager;
  },

  deploy: function(done) {
    async.waterfall([
      function loadConfig(callback) {
      var contractsManager = Embark.initConfig('config/', 'app/contracts/**/*.sol', 'development');
      callback(null, contractsManager);
    },
    function buildContracts(contractsManager, callback) {
      contractsManager.build();
      callback(null, contractsManager);
    },
    function deployContracts(contractsManager, callback) {
      var web3 = new Web3();
      web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));
      var deploy = new Deploy(web3, contractsManager);
      deploy.deployAll(function() {
        callback(null, contractsManager);
      });
    },
    function generateABI(contractsManager, callback) {
      var abiGenerator = new ABIGenerator(contractsManager);
      callback(null, abiGenerator.generateABI());
    },
    ], function(err, result) {
      done(result);
    });
  },

  buildAssets: function(abi) {
    var embarkConfig = JSON.parse(fs.readFileSync("embark.json"));

    var appConfig = embarkConfig.app;

    for(var targetFile in appConfig) {
      var originalFiles = grunt.file.expand({nonull: true}, appConfig[targetFile]);
      console.log(originalFiles);
      // remove duplicates

      var content = originalFiles.filter(function(file) {
        return file.indexOf('.') >= 0;
      }).map(function(file) {
        console.log("reading " + file);
        if (file === 'embark.js') {
          return fs.readFileSync("../js/bluebird.js") + fs.readFileSync("../js/web3.js") + fs.readFileSync("../js/embark.js")  + "\n" + abi;
        } else {
          return fs.readFileSync(file);
        }
      }).join("\n");

      var dir = targetFile.split('/').slice(0, -1).join('/');
      console.log("creating dir " + "dist/" + dir);
      mkdirp.sync("dist/" + dir);

      //console.log(content);
      fs.writeFileSync("dist/" + targetFile, content);
    }
  },

  server: function(callback) {
    var finalhandler = require('finalhandler');
    var http = require('http');
    var serveStatic = require('serve-static');

    // Serve up public/ftp folder 
    var serve = serveStatic('dist/', {'index': ['index.html', 'index.htm']});

    // Create server 
    var server = http.createServer(function onRequest (req, res) {
      serve(req, res, finalhandler(req, res));
    });

    // Listen 
    console.log("listening on port 8000".underline.green);
    server.listen(8000) ;
    callback();
  },

 watch: function() {
    var embarkConfig = JSON.parse(fs.readFileSync("embark.json"));

    var appConfig = embarkConfig.app;
    var filesToWatch = [];

    for(var targetFile in appConfig) {
      filesToWatch.push(appConfig[targetFile]);
    }

    console.log(filesToWatch);
    var watcher = chokidar.watch(filesToWatch, {
      ignored: /[\/\\]\./,
      persistent: true,
      ignoreInitial: true,
      followSymlinks: true
    });
    watcher
    .on('add', path => console.log(`File ${path} has been added`))
    .on('change', path => console.log(`File ${path} has been changed`))
    .on('unlink', path => console.log(`File ${path} has been removed`))
    .on('ready', () => console.log('ready to watch changes'));
    console.log("done!");
  },

  run: function(env) {
    Embark.deploy(function(abi) {
      Embark.buildAssets(abi);
      Embark.server(function() {
        Embark.watch();
      });
    });
  },

  build: function(env) {
    Embark.deploy(function(abi) {
      Embark.buildAssets(abi);
    });
  },

  blockchain: function(env, client) {
    var blockchain = Blockchain(client);
    blockchain.run({env: env});
  }

};

module.exports = Embark;

