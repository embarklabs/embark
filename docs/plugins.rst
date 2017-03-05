Extending functionality with plugins
====================================

**To add a plugin to embark:**

1. Add the npm package to package.json 
   e.g ``npm install embark-babel --save``
2. Then add the package to ``plugins:`` in embark.json
   e.g ``"plugins": { "embark-babel": {} }``

**Creating a plugin:**

1. ``mkdir yourpluginname``
2. ``cd yourpluginname``
3. ``npm init``
4. create and edit ``index.js``
5. add the following code:

.. code:: javascript

    module.exports = function(embark) {
    }

The ``embark`` object then provides an api to extend different functionality of embark.

**Usecases examples**

* plugin to add support for es6, jsx, coffescript, etc (``embark.registerPipeline``)
* plugin to add standard contracts or a contract framework (``embark.registerContractConfiguration`` and ``embark.addContractFile``)
* plugin to make some contracts available in all environments for use by other contracts or the dapp itself e.g a Token, a DAO, ENS, etc.. (``embark.registerContractConfiguration`` and ``embark.addContractFile``)
* plugin to add a libraries such as react or boostrap (``embark.addFileToPipeline``)
* plugin to specify a particular web3 initialization for special provider uses (``embark.registerClientWeb3Provider``)
* plugin to create a different contract wrapper (``embark.registerContractsGeneration``)
* plugin to add new console commands (``embark.registerConsoleCommand``)
* plugin to add support for another contract language such as viper, LLL, etc (``embark.registerCompiler``)
* plugin that executes certain actions when contracts are deployed (``embark.events.on``)

**embark.pluginConfig**

Object containing the config for the plugin specified in embark.json, for e.g with:

.. code:: json

    "plugins": {
      "embark-babel": { "files": ["**/*.js", "!**/jquery.min.js"], "presets": ["es2015", "react"] }
    }

``embark.pluginConfig`` will contain ``{ "files": ["**/*.js", "!**/jquery.min.js"], "presets": ["es2015", "react"] }``

**embark.registerPipeline(matchingFiles, callback(options))**

This call will return the content of the current asset file so the plugin can transform it in some way. Typically this is used to implement pipeline plugins such as Babel, JSX, sass to css, etc..

``matchingFiles`` is an array of matching files the plugin should be called for e.g [``**/*.js``, ``!vendor/jquery.js``] matches all javascript files except vendor/jquery.js

options available:
 * targetFile - filename to be generated
 * source - content of the file

expected return: ``string``

.. code:: javascript

    var babel = require("babel-core");
    require("babel-preset-react");

    module.exports = function(embark) {
        embark.registerPipeline(["**/*.js", "**/*.jsx"], function(options) {
          return babel.transform(options.source, {minified: true, presets: ['react']}).code;
        });
    }

**embark.registerContractConfiguration(contractsConfig)**

This call is used to specify a configure of one or more contracts in one or
several environments. This is useful for specifying the different configurations
a contract might have depending on the enviroment. For instance in the code
bellow, the ``DGDToken`` contract code will redeployed with the arguments
``100`` in any environment, except for the livenet since it's already deployed
there at a particular address.

Typically this call is used in combination with ``embark.addContractFile``

``contractsConfig`` is an object in the same structure as the one found in the
contracts configuration at ``config/contracts.json``. The users own
configuration will be merged with the one specified in the plugins.

.. code:: javascript

    module.exports = function(embark) {
        embark.registerContractConfiguration({
          "default": {
            "contracts": {
              "DGDToken": {
                "args": [
                  100
                ]
              }
            }
          },
          "livenet": {
            "contracts": {
              "DGDToken": {
                "address": "0xe0b7927c4af23765cb51314a0e0521a9645f0e2a"
              }
            }
          }
        });
    }

**embark.addContractFile(file)**

Typically this call is used in combination with ``embark.registerContractConfiguration``. If you want to make the contract available but not automatically deployed without the user specifying so you can use ``registerContractConfiguration`` to set the contract config to ``deploy: false``, this is particularly useful for when the user is meant to extend the contract being given (e.g ``contract MyToken is StandardToken``)

``file`` is the contract file to add to embark, the path should relative to the plugin.

.. code:: javascript

    module.exports = function(embark) {
        embark.addContractFile("./DGDToken.sol");
    }

**embark.addFileToPipeline(file, options)**

This call is used to add a file to the pipeline so it's included with the dapp on the client side.

``file`` is the file to add to the pipeline, the path should relative to the plugin.

``options`` available:
 * skipPipeline - If true it will not apply transformations to the file. For
   example if you have a babel plugin to transform es6 code or a minifier plugin, setting this to
   true will not apply the plugin on this file.

.. code:: javascript

    module.exports = function(embark) {
        embark.addFileToPipeline("./jquery.js", {skipPipeline: true});
    }


**embark.registerClientWeb3Provider(callback(options))**

This call can be used to override the default web3 object generation in the dapp. it's useful if you want to add a plugin to interact with services like http://infura.io or if you want to use your own web3.js library extension.

options available:
 * rpcHost - configured rpc Host to connect to
 * rpcPort - configured rpc Port to connect to
 * blockchainConfig - object containing the full blockchain configuration for the current environment

expected return: ``string``

example:

.. code:: javascript

    module.exports = function(embark) {
        embark.registerClientWeb3Provider(function(options) {
            return "web3 = new Web3(new Web3.providers.HttpProvider('http://" + options.rpcHost + ":" + options.rpcPort + "');";
        });
    }


**embark.registerContractsGeneration(callback(options))**

By default Embark will use EmbarkJS to declare contracts in the dapp. You can override and use your own client side library.

options available:
 * contracts - Hash of objects containing all the deployed contracts. (key: contractName, value: contract object)
  * abiDefinition
  * code
  * deployedAddress
  * gasEstimates
  * gas
  * gasPrice
  * runtimeByteCode

expected return: ``string``

.. code:: javascript

    module.exports = function(embark) {
        embark.registerContractsGeneration(function(options) {
          for(var className in this.contractsManager.contracts) {
            var abi = JSON.stringify(contract.abiDefinition);

            return className + " = " + web3.eth.contract(" + abi + ").at('" + contract.deployedAddress + "');";
          }
        });
    }

**embark.registerConsoleCommand(callback(options))**

This call is used to extend the console with custom commands.

expected return: ``string`` (output to print in console) or ``boolean`` (skip command if false)

.. code:: javascript

    module.exports = function(embark) {
        embark.registerConsoleCommand(function(cmd, options) {
          if (cmd === "hello") {
            return "hello there!";
          }
          // continue to embark or next plugin;
          return false;
        });
    }

**embark.registerCompiler(extension, callback(contractFiles, doneCallback))**

expected doneCallback arguments: ``err`` and  ``hash`` of compiled contracts

 * Hash of objects containing the compiled contracts. (key: contractName, value: contract object)

  * code - contract bytecode (string)

  * runtimeBytecode - contract runtimeBytecode (string)

  * gasEstimates - gas estimates for constructor and methods (hash)
   * e.g ``{"creation":[20131,38200],"external":{"get()":269,"set(uint256)":20163,"storedData()":224},"internal":{}}``
  * functionHashes - object with methods and their corresponding hash identifier (hash)
   * e.g ``{"get()":"6d4ce63c","set(uint256)":"60fe47b1","storedData()":"2a1afcd9"}``
  * abiDefinition - contract abi (array of objects)
   * e.g ``[{"constant":true,"inputs":[],"name":"storedData","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"}, etc...``

below a possible implementation of a solcjs plugin:

.. code:: javascript

    var solc = require('solc');

    module.exports = function(embark) {
        embark.registerCompiler(".sol", function(contractFiles, cb) {
          // prepare input for solc
          var input = {};
          for (var i = 0; i < contractFiles.length; i++) {
            var filename = contractFiles[i].filename.replace('app/contracts/','');
            input[filename] = contractFiles[i].content.toString();
          }

          // compile files
          var output = solc.compile({sources: input}, 1);

          // generate the compileObject expected by embark
          var json = output.contracts;
          var compiled_object = {};
          for (var className in json) {
            var contract = json[className];

            compiled_object[className] = {};
            compiled_object[className].code            = contract.bytecode;
            compiled_object[className].runtimeBytecode = contract.runtimeBytecode;
            compiled_object[className].gasEstimates    = contract.gasEstimates;
            compiled_object[className].functionHashes  = contract.functionHashes;
            compiled_object[className].abiDefinition   = JSON.parse(contract.interface);
          }

          cb(null, compiled_object);
        });
    }

**embark.logger**

To print messages to the embark log is it better to use ``embark.logger``
instead of ``console``.

e.g ``embark.logger.info("hello")``

**embark.events.on(eventName, callback(*args))**

This call is used to listen and react to events that happen in Embark such as contract deployment

* eventName - name of event to listen to
  * available events:
    * "contractsDeployed" - triggered when contracts have been deployed
    * "file-add", "file-change", "file-remove", "file-event" - triggered on
      a file change, args is (filetype, path)
    * "abi", "abi-vanila", "abi-contracts-vanila" - triggered when contracts
      have been deployed and returns the generated JS code
    *  "outputDone" - triggered when dapp is (re)generated
    * "firstDeploymentDone" - triggered when the dapp is deployed and generated
      for the first time

.. code:: javascript

    module.exports = function(embark) {
        embark.events.on("contractsDeployed", function() {
          embark.logger.info("plugin says: your contracts have been deployed");
        });
        embark.events.on("file-changed", function(filetype, path) {
          if (type === 'contract') {
            embark.logger.info("plugin says: you just changed the contract at " + path);
          }
        });
    }

