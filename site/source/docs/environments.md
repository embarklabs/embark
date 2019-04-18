title: Understanding Environments
layout: docs
---

Embark comes with the concept of "Environments", which make it easy to switch between different configurations of various parts of our applications that alter how the application is being built and deployed. For example, during development we probably prefer deploying our Smart Contracts on a local blockchain or testnet, until we're sure the code is ready for prime time and can be deployed in a production environment.

In this guide we'll discuss how to take advantage of environments within various configuration files of our Embark application.

## Default environment

In our guide covering [application structures](structure.html) in Embark, we've talked about that every component of our decentralized application, such as IPFS as a storage solution and Geth as a blockchain client, can be configured using a dedicated configuration file. We'll dive more into what each configuration looks like in our guides on [configuring Smart Contracts](contracts_configuration.html), [configuring decentralized storages](storage_configuration.html) and [configuring communication channels](messages_configuration.html). For now, we'll focus on the concept of **default environments**.

Environments can be defined as part of a configuration file for a dedicated service or component of our application. We can introduce as many environments as we like. It is important to understand that `default` is a special environment that can be **extended** by other environments.

Let's take a look at the `config/contracts.js` file that we've created in the [Quickstart](quick_start.html):

```
module.exports = {
  default: {
    deployment: {
      host: "localhost",
      port: 8546,
      type: "ws"
    },
    dappConnection: [
      "$WEB3",
      "ws://localhost:8546",
      "http://localhost:8545"
    ],
    gas: "auto",
    contracts: {
      SimpleStorage: {
        args: [100]
      }
    }
  }
}
```

Don't get too overwhelmed by all the different options and what they mean. We'll discuss those in-depth in [configuring Smart Contracts](contracts_configuration.html). The important part here is that `contracts.js` exports an object that provides a `default` configuration. This configuration is the default environment and can be overwritten or extended by other environments. 

If we execute `$ embark run`, Embark will use the `default` configuration to deploy our application's Smart Contracts.

## Adding and extending environments

As mentioned earlier, the `default` environment can be easily extended and overwritten by other configurations. Let's say we had a `custom` environment as well, which should come with the same configuration as `default`, but deploy `SimpleStorage` with a different constructor parameter value. We can do that by simply introducing a configuration for `custom` and specify the options as we need:

```
module.exports = {
  ...
  custom: {
    contracts: {
      SimpleStorage: {
        args: [200]
      }
    }
  }
}
```

Now, when running Embark with the `custom` environment as discussed in our guide on [Running applications](/docs/running_apps.html#Switching-environments), Embark will merge the `custom` configuration with `default` and use the resulting configuration object accordingly:

```
$ embark run custom
```

{% notification info Quick tip: %}
Notice that Embark usually already provides an additional `development` configuration. As a matter of fact, when no environment is specified in `embark run`, Embark will use the `development` configuration. 

This means that

<pre>$ embark run</pre>

is the same as

<pre>$ embark run development</pre>

{% endnotification %}

In the next chapter, we'll take a closer look at how our application can be configured using the `embark.json` configuration file.
