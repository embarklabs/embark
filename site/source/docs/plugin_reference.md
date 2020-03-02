title: Plugin APIs
layout: docs
---

This reference covers all APIs exposed by the `embark` object passed to every custom created plugin. Make sure to read the section on [creating a plugin](/docs/creating_plugins.html) first.

## .pluginConfig

`pluginConfig` is an object that contains the configuration for your plugin specified in the project's `embark.json`. For example, if a plugin configuration like the following:

```
"plugins": {
  "embark-babel": { 
    "files": ["**/*.js", "!**/jquery.min.js"],
    "presets": ["es2015", "react"]
  }
}
```

`embark.pluginConfig` will contain 

```
{ 
  "files": ["**/*.js", "!**/jquery.min.js"],
  "presets": ["es2015", "react"]
}
```

and can be used by your plugin as needed.

## .registerPipeline(matchingFiles, callback(options))

This call will return the content of the current asset file so the plugin can transform it in some way. Typically this is used to implement pipeline plugins such as Babel, JSX, sass to css, etc.

`matchingFiles` is an array of matching files the plugin should be called with for e.g `['**/*.js', '!vendor/jquery.js']` matches all JavaScript files except `vendor/jquery.js`.

Available optinos:
 * `targetFile` - filename to be generated
 * `source` - content of the file

Returns `string`

```
var babel = require("babel-core");
require("babel-preset-react");

module.exports = function(embark) {
  embark.registerPipeline(["**/*.js", "**/*.jsx"], (options) => {
    return babel.transform(options.source, {
      minified: true,
      presets: ['react']
    }).code;
  });
}
```

## .registerContractConfiguration(contractsConfig)

This call is used to specify a configure of one or more contracts in one or several environments. This is useful for specifying the different configurations a contract might have depending on the enviroment. For instance in the code bellow, the `DGDToken` contract code will redeployed with the arguments `100` in any environment, except for the livenet since it's already deployed there at a particular address.

Typically this call is used in combination with `embark.addContractFile`

`contractsConfig` is an object in the same structure as the one found in the contracts configuration at `config/contracts.json`. The users own configuration will be merged with the one specified in the plugins.

```
module.exports = function(embark) {
  embark.registerContractConfiguration({
    "default": {
      "deploy": {
        "DGDToken": {
          "args": [
            100
          ]
        }
      }
    },
    "livenet": {
      "deploy": {
        "DGDToken": {
          "address": "0xe0b7927c4af23765cb51314a0e0521a9645f0e2a"
        }
      }
    }
  });
}
```

## .addContractFile(file)

Typically this call is used in combination with `embark.registerContractConfiguration`. If you want to make the contract available but not automatically deployed without the user specifying so you can use `registerContractConfiguration` to set the contract config to `deploy: false`, this is particularly useful for when the user is meant to extend the contract being given (e.g `contract MyToken is StandardToken`)

`file` is the contract file to add to embark, the path should relative to the plugin.

```
module.exports = function(embark) {
  embark.addContractFile("./DGDToken.sol");
}
```

## .addFileToPipeline(file, options)

This call is used to add a file to the pipeline so it's included with the dapp on the client side.

`file` is the file to add to the pipeline, the path should relative to the plugin.

`intendedPath` is the intended path outside of the plugin

Available options:
 * `skipPipeline` - If `true` it will not apply transformations to the file. For
   example if you have a babel plugin to transform es6 code or a minifier plugin, setting this to
   true will not apply the plugin on this file.

```
module.exports = function(embark) {
  embark.addFileToPipeline("./jquery.js", {skipPipeline: true});
}
```

## .registerBeforeDeploy(callback(options), [callback])

This call can be used to add handler to process contract code after it was generated, but immediately before it is going to be deployed.
It is useful to replace placeholders with dynamic values.

Available options:
 * `embarkDeploy` - instance of Deploy class. Has following fields: web3, contractsManager, logger, env, chainConfig, gasLimit.
 * `pluginConfig` - plugin configuration object from embark.json
 * `deploymentAccount` - address of account which will be used to deploy this contract
 * `contract` - contract object.
 * `callback` - callback function that handler must call with result object as the only argument. Result object must have field contractCode with (un)modified code from contract.code

You can use the callback argument instead of the callback option if you prefer. It needs the same result object.

expected return: ignored

```
module.exports = function(embark) {
  embark.registerBeforeDeploy(function(options) {
    var code = options.contract.code.replace(/deaddeaddeaddeaddeaddeaddeaddeaddeaddead/ig, 'c0dec0dec0dec0dec0dec0dec0dec0dec0dec0de');
    options.callback({ contractCode: code });
  });
}
```

## .registerClientWeb3Provider(callback(options))

This call can be used to override the default web3 object generation in the dapp. it's useful if you want to add a plugin to interact with services like http://infura.io or if you want to use your own web3.js library extension.

options available:
 * rpcHost - configured rpc Host to connect to
 * rpcPort - configured rpc Port to connect to
 * blockchainConfig - object containing the full blockchain configuration for the current environment

expected return: ``string``

example:

<pre><code class="javascript">module.exports = function(embark) {
  embark.registerClientWeb3Provider(function(options) {
    return "web3 = new Web3(new Web3.providers.HttpProvider('http://" + options.rpcHost + ":" + options.rpcPort + "'));";
  });
}
</code></pre>


## .registerContractsGeneration(callback(options))

By default Embark will use EmbarkJS to declare contracts in the Dapp. You can override that and use your own client side library.

Available options:
  * contracts - Hash of objects containing all the deployed contracts. (key: contractName, value: contract object)
    * abiDefinition
    * code
    * deployedAddress
    * gasEstimates
    * gas
    * gasPrice
    * runtimeByteCode

Returns `string`

 The generated string will be used to create the contract objects in the Embark console and will be generated in `embarkArtifacts` so that the Dapp can use them.

```
module.exports = (embark) => {
  embark.registerContractsGeneration((options) => {
    const contractGenerations = [];
    Object.keys(options.contracts).map(className => {
      const contract = options.contracts[className];
      const abi = JSON.stringify(contract.abiDefinition);

      contractGenerations.push(`${className} = new web3.eth.Contract(${abi}, '${contract.deployedAddress}');
      module.exports = ${className};`);
    });
    return contractGenerations.join('\n');
  });
};
```

## .registerConsoleCommand(options)

This call is used to extend the console with custom commands.

The function takes an `object` with the following options:

- `description`: Description of the command (used by the help command)
- `matches`: Either an `array` of strings corresponding to exact matches for the command or a `function` where the only parameter in the command
  - The `function` must return a `boolean`. True if it matches, `false` if not.
- `usage`: Usage of the command that will be outputed by the help command
  - Adding `usage` is optional in the case where `matches` is an `array`
- `process`: `function` that will be executed to process the command. The `function` receives two parameters:
  - `command`: The `string` command that the user entered
  - `callback`: Callback `function` to be called at the end of the process
    - This callback takes two parameters. The first an error, the second the output of the command. The output will be displayed in the console

```
module.exports = function(embark) {
  embark.registerConsoleCommand({
    description: "Salutes the world",
    matches: ["hello", "hellowWorld"],
    // OR a function for more complex cases
    matches: (cmd) => {
      const [commandName, name] = cmd.split(' '); // You can use `split` for commands that receive parameters
      return commandName === 'hello' || commandName === 'hellowWorld'; 
    },
    usage: "hello &lt;name&gt; or helloWorld &lt;name&gt;",
    process: (cmd, callback) => {
      const [commandName, name] = cmd.split(' ');
      name = name || "noName"; // Default to "noName" when nothing is specified
      callback(null, `Hello ${name}`); // Call back with the message. This will be outputed in the console
    }
  });
}
```

## .registerCompiler(extension, callback(contractFiles, doneCallback))

Registers a new compiler for a specific contract extension.

Arguments:

- **extension**: The file extension (e.g: `.sol`)
- **callback**: Function called by Embark with the contract files that the plugin should process
 - **contractFiles**: Array of files that need to be compiled
 - **doneCallback(error, result)**: The final callback to call once every file is compiled or when there is an error
   - **error**: Error string or object when something goes wrong
   - **result**: An object containing the compiled contracts result (key: contractName, value: contract object) or, `false` if your plugin is not compatible
    - **code** - [required] contract bytecode (string)      
    - **abiDefinition** - [required] contract abi (array of objects)
      - e.g ``[{"constant":true,"inputs":[],"name":"storedData","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"}, etc...``
    - **runtimeBytecode** - [optional] contract runtimeBytecode (string)
    - **gasEstimates** - [optional] gas estimates for constructor and methods (hash)
      - e.g ``{"creation":[20131,38200],"external":{"get()":269,"set(uint256)":20163,"storedData()":224},"internal":{}}``
    - **functionHashes** - [optional] object with methods and their corresponding hash identifier (hash)
      - e.g ``{"get()":"6d4ce63c","set(uint256)":"60fe47b1","storedData()":"2a1afcd9"}``


Below a possible implementation of a solcjs plugin.
Note that the plugin checks the version and returns `false` as the result if it is not compatible:

```
const solc = require('solc');
const semver = require('semver');

module.exports = function(embark) {
  embark.registerCompiler(".sol", function(contractFiles, cb) {
    const wantedVersion = embark.config.embarkConfig.versions.solc;
    if (semver.gt(wantedVersion, '0.5.0')) {
      // We do not support greater than solidity version 0.5.0
      // This let's Embark know that we are not compatible, that way Embark will fallback to another compiler
      return cb(null, false);
    }
  
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
```

## .logger

To print messages to the embark log is it better to use ``embark.logger`` instead of ``console``.

e.g ``embark.logger.info("hello")``

## .events.on(eventName, callback(*args))

This call is used to listen and react to events that happen in Embark such as contract deployment

* eventName - name of event to listen to
   * available events:
      * `contractsDeployed` - triggered when contracts have been deployed
      * `file-add`, `file-change`, `file-remove`, `file-event` - triggered on a file change, args is (filetype, path)
      * `outputDone` - triggered when dapp is (re)generated
      * `firstDeploymentDone` - triggered when the dapp is deployed and generated for the first time
      * `check:backOnline:serviceName` - triggered when the service with ``serviceName`` comes back online
      * `check:wentOffline:serviceName` - triggered when the service with ``serviceName`` goes offline
      * `log` - triggered on a log, args is (logLevel, logMsg)
      * `contractsState` - list of contracts, their deployment status, address, etc..
      * `servicesState` - list of services and their state
      * `exit`: - triggered when embark is terminating
      * `deploy:contract:deployed`: - triggered when a contract is deployed, the callback will contain the contract object
      * `deploy:contract:undeployed`: - triggered when a contract was not deployed (typically because there is no need), the callback will contain the contract object
      * `deploy:contract:error`: - triggered when a contract couldn't be deployed due to an error, the callback will contain the contract object
      * `deploy:contract:receipt`: - triggered on a contract deployment (succefull or not), the callback will contain the resulting receipt
      * `contractsState`: - triggered often, whenever there are changes to contracts, the callback will contain an object containing the contract names, address and state, etc..
      * `deploy:beforeAll`: - triggered before contract deployment starts
      * `contracts:deploy:afterAll`: - triggered after contract deployment starts

```
module.exports = function(embark) {
  embark.events.on("contractsDeployed", function() {
    embark.logger.info("plugin says: your contracts have been deployed");
  });
  embark.events.on("file-change", function(filetype, path) {
    if (type === 'contract') {
      embark.logger.info("plugin says: you just changed the contract at " + path);
    }
  });
}
```

### .events.request(requestName, callback(*args))

This call is used to request a certain resource from Embark

* requestName - name of request to listen to
   * available requests:
     * (`deploy:contract`, contractObj) - deploys a particular contract through embark
     * (`runcode:eval`, code) - runs js code in the Embark engine.
     * (`runcode:register`, cmdName, cmdObj) - 'registers' a variable cmdName to correspond to a js object cmdObj (note: this should be done thourgh an emit);
     * (`contracts:list`) - returns a list a callback containing (err, contractList) containing a collection of available contracts
     * (`compiler:contracts`, contractFiles) - requests embark to compile a list of files, will return a compiled object in the callback
     * (`services:register`, serviceName, checkCallback) - requests embark to register a service, it will execute checkCallback every 5 seconds, the callback should return an object containing the service name and status (See embark.registerServiceCheck)
     * (`console:command`, cmd) - execute a command in the console
     * (`proxy:endpoint:get`, endpoint) - retrieves the endpoint of Embark's proxy. This is the endpoint that should be used to connect to the blockchain node. The resulting protocol (HTTP or WS) is determined by the dApp's blockchain config.
     * (`proxy:endpoint:ws:get`, endpoint) - retrieves the endpoint of Embark's WebSockets proxy, regardless of the configuration settings in the blockchain config.
     * (`proxy:endpoint:http:get`, endpoint) - retrieves the endpoint of Embark's HTTP proxy, regardless of the configuration settings in the blockchain config.

```
module.exports = function(embark) {
  embark.events.request("code", function(code) {
    // Do something with the code
  });
}
```

## .registerServiceCheck(serviceName, callback({name, status}), time)

This call is used to register a service in embark so it's periodically checked.
It will be displayed in the Embark Dashboard, and will also trigger events such as ``check:backOnline:yourServiceName`` and ``check:backOffline:yourServiceName``

* serviceName - name of service (string)
* callback:
  * `name` - name/text to display (string)
  * `status` - status of the service (string, `on` or `off` or `warn`)
* time (optional) - ms interval to call the callback (default: 5000 ms)

```
module.exports = function(embark) {
  embark.registerServiceCheck("MyServer", function(cb) {
    if (myServiceOnline()) {
      return cb({name: "MyServer Online", status: "on"});
    } else {
      return cb({name: "MyServer Offline", status: "off"});
    }
  });
}
```

## .registerUploadCommand(cmdName, callback)

This call is used to add a new cmd to ``embark upload`` to upload the dapp to a new storage service. In the example, `run` doesn't exist. You need to import a library that runs shell commands like [shelljs](https://www.npmjs.com/package/shelljs)

```
module.exports = function(embark) {
  embark.registerUploadCommand("ipfs", function() {
    run("ipfs add -r dist/");
  });
}
```

## .addCodeToEmbarkJS(code)

This call is used to add code to the embark.js library. It's typically used to extend it with new functionality, new storage providers, new communication providers, etc..

```
module.exports = function(embark) {
  embark.addCodeToEmbarkJS("alert('hello world!')");
}
```

## .addProviderInit(providerType, code, initCondition(config))

This call is used to add code to be executed in the initialization under the condition that ``initCondition`` returns true. For example this can be used to set the storage provider of EmbarkJS to ipfs if ipfs is enabled as a provider in the config

* providerType - type of provider (string, "storage" or "communication")
* code - code to add (string)
* callback:
  * "config" - config of the ``providerType``

```
module.exports = function(embark) {
  let code = "\nEmbarkJS.Storage.setProvider('ipfs')";
  embark.addProviderInit('storage', code, (storageConfig) => {
    return (storageConfig.provider === 'ipfs' && storageConfig.enabled === true);
  });
}
```

## .registerImportFile(importName, importLocation)

This call is used so the plugin can make a certain file available as a library to a user

```
var path = require('path')

module.exports = function(embark) {
  embark.registerImportFile("my-lib", path.join(__dirname, "my-lib.js"));
}
```

## .registerActionForEvent(eventName, options, cb)

This lets you register an action for an event. An action, is like a regular command handler event, but enables multiple actions to be registered for the same event and let's you modify the params before sending them back to the next action or back to Embark.

Here is an example where, before deploying a contract, we check the length of the bytecode to see if it reaches the limit:
```
embark.registerActionForEvent("deployment:contract:beforeDeploy", async (params, cb) => {
  cosnt contarct = params.contract;
  if (!contract.code) {
    return callback();
  }
  
  const code = (contract.code.indexOf('0x') === 0) ? contract.code.substr(2) : contract.code;
  const contractCodeLength = Buffer.from(code, 'hex').toString().length;
  if (contractCodeLength > MAX_CONTRACT_BYTECODE_LENGTH) {
    return callback(new Error(`Bytecode for ${contract.className} contract is too large. Not deploying.`));
  }
  callback();
});
```

### Parameters
- `eventName`: String, Name fo the event you want an action to be registered to
- `options`: Object, optional, options for the action registration
  - `priority`: Integer, priority for when the action should be called. Useful if you want to run before or after other actions. The default priority is 50 and the highest priority is 1 (so high priority runs first)

### Available events for actions

- `embark:engine:started`: Called when the engine just started. No params
- `blockchain:config:modify`: Let's you modify the blockchain configs before starting a blockchain node. Only param is the initial `blockchainConfig`
- `deployment:contract:beforeDeploy`: Called before a contract is deployed. Only param is the `contract`
- `deployment:contract:shouldDeploy`: Also called before a contract is deployed, but let's you determine if the contract should be deployed. Two params: `contract` and `shouldDeploy`, set `shouldDeploy` to `false` to disable its deployment
- `deployment:contract:undeployed`: Called after a contract is determined to not deploy. Only param is `contract`
- `deployment:contract:deployed`: Called after a contract deployed. Only param is `contract`
- `deployment:deployContracts:beforeAll`: Called before any contract is deployed. No params
- `deployment:deployContracts:afterAll`: Called after all contracts have deployed. No params
- `tests:contracts:compile:before`: Called before the contracts are compiled in the context of the test. Only param is `contractFiles`
- `tests:contracts:compile:after`: Called after the contracts are compiled in the context of the test. Only param is `compiledContracts`
- `blockchain:proxy:request`: Called before a request from Embark or the Dapp is sent to the blockchain node. You can modify or react to the payload of the request. Params are:
  - `request`: an object containing the request payload
  - `transport`: an object containing the client's websocket connection to the proxy
  - `isWs`: a boolean flag indicating if the request was performed using websockets
- `blockchain:proxy:response`: Called before the node response is sent back to Embark or the Dapp. You can modify or react to the payload of the response. Params are:
  - `request`: an object containing the request payload
  - `response`: an object containing the response payload
  - `transport`: an object containing the client's websocket connection to the proxy
  - `isWs`: a boolean flag indicating if the request was performed using websockets
- `runcode:register:<variable>`: when variables are registered in the console using `runcode:register`, actions with the name of the variable (ie `runcode:register:web3`) will be run *before* the variable is actually registered in the console. This allows a variable to be modified by plugins before being registered in the console. Params are:
  - `<variable>`: an object containing the variable registered in the console
  - `callback`: callback to be called once the variable has been modified. Pass the following parameters to the callback:
    - `error`: Any error that ocurred during the action
    - `<variable>`: The modified variable to be registered in the console.
