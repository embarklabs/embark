title: Creating Plugins
layout: docs
---

If you can't [find a plugin](/plugins) that fulfills your needs, it's probably a good time to think about creating your own. In this guide we'll discuss how to set up a custom plugin and briefly talk about various use cases. Later on we'll dive into the available [Plugin APIs](/docs/plugin_reference.html).

## Creating a plugin project

A plugin is really just another NodeJS project that takes a plugin API object and make use of it. To get started, all we have to do is creating a new directory and initializing it as an npm module:

```
$ mkdir yourpluginname
$ cd yourpluginname
$ npm init
```

Once that is done we can create an `index.js` file that contains the following code:

```
module.exports = function(embark) {
  // plugin logic goes here
}
```

The `embark` object provides plenty of APIs to extend different functionalities of Embark, which can be found in the [Plugin Api Reference](plugin_reference.html). 

## Usecase examples

Since the Plugin API surface is rather big, here are some usecase examples to sparkle some inspiration:

* Adding a Smart Contract file to the list of source files to be watched so they can be used by other Smart Contracts with `addContractFile()`
* Adding a Smart Contract configuration using `registerContractConfiguration()` (goes well with `addContractFile()`)
* Adding a hook that's called before a Smart Contract's binary will be deployed using `beforeDeploy()`
* Configure a custom provider for web3 initialization with `registerClientWeb3Provider()`
* Create your own custom Smart Contract wrapper logic using `registerContractsGeneration()`
* Adding a new command to Embark's interactive console using `registerConsoleCommand()`
* Adding support for other compilers such as Viper, LLL, etc. using `embark.registerCompiler()`
* Executing certain actions when Smart Contracts are deployed with `embark.events.on()`
* Registering a service in Embark  - `registerServiceCheck()`

