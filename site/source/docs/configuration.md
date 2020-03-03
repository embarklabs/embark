title: Configuring Embark
layout: docs
---

Embark offers a lot of fine control when it comes to configuring the different parts of our decentralized application. In this guide we'll take a closer look at the basic configuration options provided by our application's `embark.json` file, which are mainly relevant for, but not restricted to, our application structure.

For configuration options related to connecting to a blockchain client, [deploying your Smart Contracts](contracts_configuration.html), [decentralized storage](storage_configuration.html), [Whisper](messages_configuration) or [ENS](naming_configuration.html), please head over to the dedicated configuration guides respectively.

## Overview

Every application [created with Embark](create_project.html) comes with an `embark.json` file. This file configures where Embark has to look for Smart Contract files and assets, as well as plugins options. Here's what a freshly scaffolded `embark.json` file could look like:

```
{
  "contracts": ["contracts/**"],
  "app": {
    "js/dapp.js": ["app/dapp.js"],
    "index.html": "app/index.html",
    "images/": ["app/images/**"]
  },
  "buildDir": "dist/",
  "generationDir": "embarkArtifacts",
  "config": "config/",
  "versions": {
    "solc": "0.4.25"
  },
  "plugins": {
  },
  "options": {
    "solc": {
      "optimize": true,
      "optimize-runs": 200
    }
  }
}
```

Alternatively, it's possible to use a `embark.config.js` file, which exports either a configuration object or a function that calculates the object. This is particularly useful when the configuration needs to be built based on asynchronous operations. To make use of `embark.config.js`, simply create the file in your DApp and make sure it exports an (async) function which resolves with a config object like this:

```js
// embark.config.js

module.exports = async function () {
  const secrets = await getSecrets();
  return {
    // Embark configuration goes here
  };
};
```

Embark will import and run the exported function. If `module.exports` is a `Promise` or a function that returns a `Promise` (as above), Embark will automatically resolve the promised config object.

Let's look at the different configuration options and learn what they do and mean.

### contracts

This is a list of directories in which Embark should look for Smart Contract files. These typically are globbing patterns (e.g `["contracts/**/*.sol"]` will match all sol files inside any folders inside `contracts/`).

### app

Everything inside `app` configures the assets of our application, which could be anything from HTML, JavaScript to CSS and other assets. JavaScript source files are compiled using webpack to create a bundle, all other file types are simply copied to the specified destination.

In the key/value pairs of `app`, every key describes the destination, while the value describes a list of glob patterns for files to be transformed and copied.

  - **js/dapp.js** - This is the JavaScript bundle that contains our application. Specifically, all files that are defined in this option (`app/dapp.js`).
  - **index.html** - The entry point of our application (`app/index.html`)
  - **images** - All image assets of our application that we can find in `app/images/`.

Change these configurations as you need.

### buildDir

The directory to which the build artifacts are being moved to. Everything inside this configured folder can be considered a production ready build (default is `dist/`).

{% notification info 'Important note:' %}
When using Embark with any other complementary CLI tool for building a DApp, such as Create-React-App or Angular CLI, `buildDir` should point at the same location as the complementary tool writes its distribution files to.

This is important so that Embark picks up the right files when doing things like [deploying your app](/docs/storage_deployment.html) on IPFS or Swarm.
{% endnotification %}

### generationDir

A directory in which Embark is going to generate artifacts that can be used for DApp development. This include Smart Contract ABIs as well Embark specific configuration data extracted from the project's configuration. The default name of this directory is `embarkArtifacts`. To learn more about Embark Artifacts, head over to our guide on [Using EmbarkJS](/docs/javascript_usage.html).

### config

This is the location of the configuration files. There are different options to configure those:

* **A string** (e.g `"config/"`) - Will assume the directory in which the configuration files are located (`blockchain.js`, `contracts.js`, etc).
* **An object**:
  * Each property would configure the path of each configuration file
  * Configuration properties can be set to false to disable the component/service in question

```
...
"config": {
  "contracts": "contracts.js",
  "blockchain": false,
  "storage": false,
  "communication": false,
  "webserver": false
},
...
```

### versions (3rd-party libraries)

Here you can optionally specify the versions of the library to be used by Embark. Embark will automatically download the specific library version if necessary.

Currently, `solc` is the only library that can be specified in this way. It's possible to override the `solc` version in other configuration files such as `contracts.json` on a per environment basis.

### plugins

This is a list of installed plugins. For more information on Plugins, head over to our [Plugins guide](/docs/installing_plugins.html).

### options

The `options` property enable us to configure options for specific components and services of Embark and our application. Currently supported are options for the `solc` compiler, as well as options related to Embark's `reset` command:
```
...
  "options": {
    "solc": {
      "optimize": true,
      "optimize-runs": 200
    },
  }
...
```

## Configuring Embark's reset command

As mentioned in the section above, it's possible to configure how Embark behaves when [resetting projects](/docs/running_apps.html#Resetting-apps). Most of the time, the default configuration should do the trick, however, if we need more control over what files should be removed as part of the reset, we can do that using the `reset` option.

It comes with two properties:

- **defaults** - Tells Embark whether it should reset the default files it usually resets or not
- **files** - A list of files Embark should remove as well when resetting the project

With these two options we have full control over what files `reset` will remove.

```
...
  "options": {
    "reset": {
      "defaults": true,
      "files": ["some/other/file"]
    }
  }
...
```
