title: Application Structure
layout: docs
---

Once a [project is initialized](/docs/create_project.html), it's a good time to take a look at the resulting project structure, to get a better idea of what's going on. In this guide we'll explore an Embark project's structure and learn where to find different file types and configurations.

**For Smart Contract developers**: This [guide covers](#Smart-Contracts-only-template-structure) projects that have been created with the [`--contracts-only` option](create_project.html#Creating-“contracts-only”-apps) as well.

{% notification info 'Project structure with other tools' %}
Since Embark version 4.0.0, it's possible (and recommended) to use Embark along with existing front-end tooling. This could be tools such as [Angular CLI](https://cli.angular.io), [Vue CLI](https://cli.vuejs.org) or [Create React App](https://github.com/facebook/create-react-app).

When using Embark in combination with any of these or similar tools, the application structure will likely look different as each of these tools comes with an opinion and preference on how an application should be structured.
{% endnotification %}

## Overview

An Embark project's structure is pretty straight forward. It contains a `config`, a `test`, an `app`, a `contracts` and a `dist` folder for their dedicated purposes. Most of them are self explanatory, but let's take a look at the overall file tree.

``` plain
├── app/
├── contracts/
├── config
|   ├── blockchain.js
|   └── contracts.js
|   └── storage.js
|   └── communication.js
|   └── webserver.js
└── test/
└── dist/
└── chains.json
└── embark.json
```

### app/

This is where the frontend of our decentralized application lives. It doesn't matter whether we prefer using one of the amazing frameworks out there, like Angular or Vue, or if we like writing vanilla JavaScript. Embark will build our application with all the source files it can find inside `app`.

### contracts/

Smart Contracts go here. Embark will automatically compile, deploy & track our Smart Contracts from this directory. While Embark is running, it'll detect changes made to any Smart Contract and re-deploy it and its dependencies if necessary.

### config/

There are many different components inside a decentralized application that can be configured. Embark offers different configuration files for each of those components and gives us full control over how the different parts are behaving. The configuration files for the different components of the stack can be found here.

* **blockchain.js**
This file contains the configuration used for Embark to run a blockchain node with an Ethereum client such as go-ethereum, Parity, or a simulator like Ganache.

* **contracts.js**
This file contains the configuration for Smart Contracts, including their arguments and relationships between them, such as dependencies. Here we can also specify where to deploy our Smart Contracts and how the application should attempt to connect to a node. Please see [Configuring Contracts](contracts.html) for more details.

* **storage.js**
This file lets us configure what storage component to use (e.g IPFS), including what node to connect to, to upload and retrieve data through the application. Head over to our guide on [configuring decentralized storage](storage_configuration.html) for details configuring a decentralized storage system for our application.

* **communication.js**
Similar to the other configuration files, this file can be used to configure what communication component should be used (e.g Whisper) and what node it should connect to. Check out our guide [message configuration](messages_configuration.html) to learn more about the available configuration options.

* **webserver.js**
This file contains the configuration for the webserver that Embark starts when developing our application. Configuration options are the host, port and other useful options, such as whether a browser window should be opened on start up or not.

### test/

Embark lets us write tests for our Smart Contracts in JavaScript as well as [Solidity](https://github.com/ethereum/remix/tree/master/remix-tests). All of our tests are located here. To learn more about testing with Embark head over to our [guide on testing](contracts_testing.html).

### dist/

The build output of our application will be put here. Everything inside this folder can be considered a production ready build artifact. This folder also gets uploaded to a decentralized storage using `embark upload`.

### chains.json

This file is used to keep track of the deployed contracts in each chain. This is a super useful feature as it lets Embark figure out all by itself if and when a Smart Contract needs to be (re)deployed. See chains file documentation for more information

### embark.json

In order to provide as much flexibility for our users as possible, Embark comes with an `embark.json` file that lets us configure our own directory structure. This file is also used to specify Embark plugins and other configurations. More information on how to use this configuration file, can be found in [configuring embark.json](configuration.html).

## Smart Contracts only template structure

When creating a project using the `--contracts-only` option, the resulting structure is a little bit simpler. Let's take quick look:

```
├── contracts/
└── test/
└── dist/
├── contracts.js
└── chains.json
└── embark.json
```

Most components or services that our application could take advantage of are disabled with the exception of Smart Contracts support, but we can still re-enable them in the `embark.json` configuration file if needed. Notice that this time, the `contracts.js` config file is in the root of the project's directory. This is because in the `embark.json` config file,`contracts` points to a path in the same folder.

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
As mentioned earlier, other services like storage and blockchain support can be easily re-enabled by changing them to path values as well.

Awesome, now that we have a better understanding of what a project in Embark looks like, let's head over to the next guide and explore the different ways of running an application with Embark!
