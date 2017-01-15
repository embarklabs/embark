Extending functionality with plugins
====================================

**To add a plugin to embark:**

1. Add the package to package.json 
2. Then add the package to the list of ``plugins:`` in embark.json

**Creating a plugin:**

1. ``mkdir yourpluginname``
2. ``cd yourpluginname``
3. ``npm init``
4. create and edit ``index.js``
5. add the following code:

.. code:: javascript

    module.exports = function(embark) {
    }

The ```embark``` object then provides an api to extend different functionality of embark.

**embark.pluginConfig**

Object containing the config for the plugin specified in embark.json, for e.g with:

.. code:: json

    "plugins": {
      "embark-babel": { "files": ["**/*.js", "!**/jquery.min.js"], "presets": ["es2015", "react"] }
    }

``embark.pluginConfig`` will contain ``{ "files": ["**/*.js", "!**/jquery.min.js"], "presets": ["es2015", "react"] }``

**embark.registerClientWeb3Provider(callback(options))**

This call can be used to override the default web3 object generation. it's useful if you want to add a plugin to interact with services like http://infura.io or if you want to use your own web3.js library extension.

options available:
 * rpcHost - configured rpc Host to connect to
 * rpcPort - configured rpc Port to connect to
 * blockchainConfig - object containing the full blockchain configuration for the current environment

expected return: ``string``

**embark.registerContractsGeneration(callback(options))**

By default Embark will use EmbarkJS to declare contracts in javascript. You can override and use your own client side library.

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

**embark.registerPipeline(matchingFiles, callback(options))**

This call will return the content of the current asset file so the plugin can transform it in some way. Typically this is used to implement pipeline plugins such as Babel, JSX, sass to css, etc..

``matchingFiles`` is an array of matching files the plugin should be called for e.g [``**/*.js``, ``!vendor/jquery.js``] matches all javascript files except vendor/jquery.js

options available:
 * targetFile - filename to be generated
 * source - content of the file

expected return: ``string``

