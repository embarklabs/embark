title: Configuring Smart Contracts
layout: docs
---

As many decentralized applications are powered by Smart Contracts, configuring and deploying them should be easy. That's why Embark offers a declarative approach to define what Smart Contracts we're interested in to deploy, what their dependencies are, as well as what they should be initialized with once instantiated. This guide will explore the different configuration options that help making deploying Smart Contracts a breeze.

## Basic Smart Contract Configuration

Unless specified differently in our application's `embark.json`, Smart Contracts are configured either in the `config/contracts.js` file, or, if we're dealing with a [Smart Contract only app](create_project.html#Creating-%E2%80%9Ccontracts-only%E2%80%9D-apps), the `./contracts.js` file in the root of our project.

A Smart Contract configuration is placed in an environment's `contracts` property, with the name of the Smart Contract being the identifier. The following code creates a configuration for the `SimpleStorage` contract in the `development` environment:

```
module.exports = {
  ...
  development: {
    ...
    contracts: {
      SimpleStorage: {
        ...
      }
    }
  }
  ...
}
```

Smart Contracts can be configured differently per environment just by adding a dedicated configuration to the corresponding environment. Head over to our [guide on environments](environments.html) to learn more about this.

### Configuring constructor parameters

Often, Smart Contracts need to be initialized with certain values right after they have been deployed. We can configure a Smart Contract's constructor parameters using the `args` property. `args` is either a list of values, which will be applied to the Smart Contract's constructor parameters in the same order they are defined, or it can be an object specifying the parameters using named keys.

```
...
development: {
  contracts: {
    SimpleStorage: {
      args: [100]
    }
  }
}
...
```

The following configuration configures the `SimpleStorage`'s `initialValue` parameter, assuming that that one exists. Notice that by using this syntax, the order of constructor parameter values doesn't matter anymore:

```
...
development: {
  contracts: {
    SimpleStorage: {
      args: {
        initialValue: 100
      }
    }
  }
}
...
```

### Configuring gas and gas price

Both, `gas` and `gasPrice` can be configured for each Smart Contract. If we don't want to configure that for every single contract, we can also specify `gas: auto` in the environment, like this:

```
...
development: {
  gas: 'auto',
  contracts: {
    SimpleStorage: {
      args: [100],
      gas: 800000,
      gasPrice: 5
    }
  }
}
...
```

Another cool feature of Embark is that it supports human readable ether units, to improve the developer experience.

{% notification info 'Human readable ether units' %}

Embark supports **human readable ether units** in places where ether unit values are required. [Read here](#Human-readable-Ether-units) for more information.
{% endnotification %}

## Configuring Smart Contract Dependencies

When building more complex applications, it's very common that a Smart Contract depends on another one. Embark makes it very easy to not only ensure dependency Smart Contracts are deployed before the Smart Contract in question deploys, but also accessing their deployed addresses.

All we have to do is specifying the name of the Smart Contract we're interested in, prefixed with a "$". Embark will then take care of figuring out in which order our Smart Contracts need to be deployed, as well as replacing all `$CONTRACT_NAME`'s with their corresponding addresses. Assuming `SimpleStorage` depends on `OtherContract`, this can be easily configured like this:

```
...
contracts: {
  SimpleStorage: {
    args: [100, '$OtherContract']
  },
  OtherContract: {...}
}
...
```

## Disabling deployment

Sometimes we want to configure different behaviour for certain contracts within different [environments](environments.html). One of those cases could be that we don't actually want to deploy `SimpleStorage` in the production environment as we might expect some other storage Smart Contract to already be somewhere out there.

We can prevent Embark from deploying any of our Smart Contracts by using the `deploy` configuration and setting it to `false` like this:

```
...
development:
  contracts: {
    SimpleStorage: {
      args: [100]
    }
  }
},
production: {
  contracts: {
    SimpleStorage: {
      deploy: false
    }
  }
}
...
```

## Deployment strategies

In order to give users full control over which Smart Contracts should be deployed, Embark comes with a configuration feature called "deployment strategies". Deployment strategies tell Embark whether it should deploy all of the user's Smart Contracts (and its (3rd-party) dependencies, or just deploy individual Smart Contracts.

There are two possible strategy options: 

- **implicit** - This is the default. Using the `implicit` strategy, Embark tries to deploy all Smart Contracts configured in the `contracts` configuration, including its (3rd-party) dependencies.
- **explicit** - Setting this option to `explicit` tells Embark to deploy the Smart Contracts specified in the `contracts` configuration without their dependencies. This can be combined with [disabling deployment](#Disabling-deployment) of individual Smart Contracts for fine control.

```
contracts: {
  strategy: 'explicit' // 'implicit' is the default
  SimpleStorage: {
    deploy: false
  },
  AnotherStorage: {
    ...
  }
}
```


## Deploying multiple instances

In cases where we want to create multiple instances of the same Smart Contract but with, for example, different initialization values per instance, we can use the `instanceOf` property and refer to the original Smart Contract that should be deployed multiple times.

This can then be combined with [disabling the deployment](#Disabling-deployment) of the original Smart Contract like this:

```
...
contracts: {
  Currency: {
    deploy: false,
  },
  Usd: {
    instanceOf: 'Currency',
    args: [200]
  },
  MyCoin: {
    instanceOf: 'Currency',
    args: [300]
  }
}
...
```

In the example above, we deploy `Usd` and `MyCoin` as instances of `Currency`. Notice that `Currency` itself isn't going to be deployed but merely functions as a "recipe" to create other instances of it.

## Referencing already deployed Smart Contracts

Embark not only integrates with the Smart Contracts that we create and own, but also with Smart Contracts that are already deployed and potentially owned by third-parties. If we wish to reference such a Smart Contract instance, all we have to do is specify the `address` of the instance in question.

The following example configures `UserStorage` to be a Smart Contract instance that's already deployed:

```
...
contracts: {
  UserStorage: {
    address: '0x123456'
  }
}
...
```

## Configuring source files

By default Embark will look for Smart Contracts inside the folder that's configured in the application's [embark.json](configuration.html#contracts), the default being the `contracts` folder. However, if we want to change the location to look for a single Smart Contract's source, or need to compile a third-party Smart Contract to get hold of its ABI, we can do so by using the `file` property.

`file` specifies a full path to a file that contains the source code for the Smart Contract in question.

```
...
contracts: {
  SimpleStorage: {
    file: './some_folder/simple_storage.sol',
    args: [100]
  }
}
...
```

If Embark doesn't find the file in the specified path, it'll expect it to be a path inside installed `node_modules` dependencies. The following example configures a source file path that points to a third-party Smart Contract that is installed as a dependency:

```
...
contracts: {
  ERC20: {
    file: 'openzeppelin-solidity/contracts/token/ERC20/ERC20.sol'
  }
}
...
```

Embark even supports reading the source from `https`, `git`, `ipfs` and `bzz` URIs, enabling us to compile Solidity Smart Contracts that aren't even located in our local machine.

```
...
contracts: {
  ERC725: {
    file: 'git://github.com/status/contracts/contracts/identity/ERC725.sol#develop'
  },
  ERC725: {
    file: 'github.com/status/contracts/contracts/identity/ERC725.sol'
  },
  Ownable: {
    file: 'https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/ownership/Ownable.sol'
  }
}
...
```

## Providing ABIs

In order to use Smart Contract instances created by web3 either in [deployment hooks](Deployment-hooks) or in [Embark's JavaScript client](contracts_javascript.html), Embark needs to get hold of the Smart Contracts' ABIs and pass those on to web3.

This is not a problem when dealing with Smart Contracts that we own, or at least have [access to their sources](#Configuring-source-files) so we Embark can compile them accordingly. However, if we don't have either the source, nor do we want to create a Solidity interface ourselves for Embark to compile, we can provide an already defined ABI for a dedicated Smart Contract using the `abiDefinition` property, so Embark can make use of that.

The following example configures `SimpleStorage` to be already deployed somewhere, but we'd still like to use the web3 instance in our `afterDeploy` hook.

```
...
contracts: {
  SimpleStorage: {
    address: '0x0bFb07f9144729EEF54A9057Af0Fcf87aC7Cbba9',
    abiDefinition: [...]
  }
},
afterDeploy: async (deps) => {
  const value = await deps.contracts.SimpleStorage.methods.get().call();
  console.log(value);
}
...
```

`afterDeploy` and other deployment hooks are covered in [Deployment Hooks](#Deployment-hooks).

## Providing Artifacts

Similar to providing ABIs, providing an Embark artifact lets you configure your contract using an already generated artifact.

That way, you don't need to have the contract on disk or even deploy it, if the address is specified in it.

Here is how you can do it:

<pre><code class="javascript">...
contracts: {
  SimpleStorage: {
    artifact: './path/to/SimpleStorage.json'
  }
}
...
</code></pre>

## Deployment tracking

Embark's Smart Contract deployment mechanism prevents the deployment of Smart Contracts that have already been deployed. This turns out to be a powerful feature as you don't have to worry about keeping track of it. The way this works is that, by default, Embark creates a file `./embark/chains.json` in which it stores the name and address of the deployed Smart Contracts. That information is then mapped to the hash of the block in which the Smart Contract have been deployed:

```
{
  BLOCK_HASH {
    "contracts": {
      HASH(NAME, BYTECODE, ARGS, ADDRESS): {
        "name": NAME,
        "address: ADDRESS
      }
    }
  }
}
```

With concrete data, the contents of `chains.json` could look something like this:

```
{
  "0x6454b3e22cc9abe24bcd9f239687ad68ab6addb4f271a6b955f2e6111522310a": {
    "contracts": {
      "0x3043b04ad856d169c8f0b0509c0bc63192dc7edd92d6933c58708298a0e381be": {
        "name": "ENSRegistry",
        "address": "0x4F75E2beCbD08c5dD67f74aA0E28558a6a596528"
      },
      "0xc51636fc4431a598f31d35de56a5e59b1a55d601babbdf5e9718a520654a4a93": {
        "name": "Resolver",
        "address": "0xD9c5bEeD72A0f2FeAcF43730eF2B4bC86F38Cb6f"
      },
      "0x269ef61966bd985f10d8ae13d7eaa498b423372f266fb5c188f60fa5618ff334": {
        "name": "FIFSRegistrar",
        "address": "0xe7120Bfe50b72a9629546dCe05c3821b3bb52B4E"
      },
      "0xc920172104d0372dfa1375d4c9ef05ae15569b94b88fd4b0d5a834965dc7420b": {
        "name": "SimpleStorage",
        "address": "0x4928bFf909063465d3cc1708E5F9c6EB0E3F324E"
      }
    }
  }
}
```

### Disabling tracking

If we prefer to have full control over the deployment process and don't want Embark to keep track of individual Smart Contract deployments, we use the `track` configuration and set it `false`.

The following example ensures `ERC20` won't be tracked and therefore redeployed in every deployment cycle.

```
...
contracts: {
  ERC20: {
    track: false
  }
}
...
```

### Specifying a tracking file

In addition to enabling and disabling tracking, it's also possible to tell Embark which file it should use for tracking. This can be useful for tracking deployed Smart Contracts on different platforms, such as testnets and the mainnet. The tracking state of those platforms should most likely be under version control, because we certainly don't want multiple people to redeploy our Smart Contracts on multiple platforms. Putting those files under version control ensures everybody else gets the already tracked state. The contents will have the same schema as discussed above.

```
...
contracts: {
  ERC20: {
    track: 'path/to/some/file'
  }
}
...
```

Having the file referenced above under version control ensures that other users of our project don't redeploy the Smart Contracts on different platforms.

## Deployment hooks

Sometimes we want to execute certain logic when Smart Contracts are being deployed or after all of them have been deployed. In other cases, we'd even like to control whether a Smart Contract should be deployed in the first place. For those scenarios, Embark lets us define the deployment hooks `beforeDeploy`, `deployIf`, `onDeploy` and `afterDeploy`.

Deployment hooks have access to a `dependencies` object that comes with instances of all Smart Contracts that are defined as dependency of the hooks using the `deps` property of the Smart Contract in question, and the Smart Contract itself. In addition to all relevant Smart Contract instances, this object also exposes the current `web3` instance and a `logger` instance as shown in the examples below.

### Conditional Deployment with `deployIf`

We can specify a condition that decides whether a contract should be deployed by using the `deployIf` hook. `deployIf` is a function that either returns a promise or is created using `async/await` syntax and has to resolve to a boolean value. If the resolve value is `true`, the Smart Contract in question will be deployed. If it's `false`, Embark will skip deploying the Smart Contract in question.

```
...
contracts: {
  ERC20: {
    deployIf: async (dependencies) => {
      return await dependencies.contracts.Manager.methods.isUpdateApproved().call();
    },
    deps: ['Manager']
  },
  Manager: {...}
}
...
```

Notice how `dependencies.contracts` gives access to the `Manager` contract instance. This however, is only possible because `Manager` has been defined as dependency of `ERC20` using the `deps` property. If we're using a Node version that doesn't support async/await, the same can be achieved using promises like this (web3 APIs already return promises):

```
...
ERC20: {
  deployIf: (dependencies) => {
    return dependencies.contracts.Manager.methods.isUpdateApproved().call();
  },
  deps: ['Manager']
},
...
```

### `beforeDeploy` hook

`beforeDeploy` is a hook that, just like the name says, is executed before something is deployed. This hook is the counterparts to the [afterDeploy](#afterDeploy-hook) and can be used in either individual Smart Contract configurations, or for all Smart Contracts. E.g. the following snippet configures `beforeDeploy` just for `SimpleStorage`:

```
SimpleStorage: {
  beforeDeploy: async () => {
    console.log('before deploying SimpleStorage');
  }
}
```

Wheras this configuration here runs the hook before all Smart Contracts are being deployed:

```
contracts: {
  SimpleStorage: { ... }
  beforeDeploy: async () => {
    console.log('Before all deploy');
  }
}
```

### `onDeploy` hook

We can specify the `onDeploy` hook to execute code, right after a contract has been deployed. Just like `deployIf` and `afterDeploy`, `onDeploy` is a function that has access to the Smart Contract's dependencies defined in its `deps` property. The following example executes `SimpleStorage`'s `set()` method, once deployed.

```
...
contracts: {
  SimpleStorage: {
    args: [100],
    onDeploy: async (dependencies) => {
      await dependencies.contracts.SimpleStorage.methods.set(150).send({from: dependencies.web3.web3.eth.defaultAccount});
    }
  }
}
...
```

To actually `send` transactions and not just make `call`s, you will probably need to provide a `from` account. You can use the `web3` instance inside `dependencies` to get the `defaultAccount` as above.

Also, as mentioned above, every deployment hook works with plain promises as well:

```
...
SimpleStorage: {
  args: [100],
  onDeploy: (dependencies) => {
    return dependencies.contracts.SimpleStorage.methods.set(150).send();
  }
}
...
```

### `afterDeploy` hook

If we want to execute code once all of our Smart Contracts have been deployed, Embark has got us covered with the `afterDeploy` hook. The same rules apply here. `afterDeploy` has access to all deployed contract instances through the `dependencies` object.

```
...
contracts: {
  SimpleStorage: {
    args: [100]
  },
},
afterDeploy: (dependencies) => {
  dependencies.contracts.SimpleStorage.methods.set(150).send({from: dependencies.web3.eth.defaultAccount});
}
...
```

### Error Handling

Since we use functions for these deployment hooks, we have to manage errors ourselves. We skipped that step in the above examples to save space, but here is an easy example on how you can do it:

```
onDeploy: async (dependencies) => {
  try {
    await dependencies.contracts.SimpleStorage.methods.set(85).send({from: dependencies.web3.eth.defaultAccount});
  } catch (e) {
    console.error('Error during onDeploy', e);
  }
}
```

{% notification info 'A note on deployment hook string syntax' %}
In older versions of Embark, deployment hooks have been defined as an array of strings. This is due historical reasons where configuration files used to be JSON files that don't support functions.

The examples above can be therefore written as:

<pre class="highlight">afterDeploy: ['SimpleStorage.methods.set(150).send()']
onDeploy: ['SimpleStorage.methods.set(150).send()']
deployIf: 'await Manager.methods.isUpdateApproved()'
</pre>

This string syntax is still supported, but will be deprecated and likely be removed in future versions of Embark.
{% endnotification %}

### Logging with context

Often we use log statements to either debug code or simply to output what's going on at the moment. It can be useful to output logs within deployment hooks as well. To make sure our deployment hooks don't drown in the rest of Embark's output, we can use the injected `logger` which prefixes every log message with a context indicator.

For example, when logging something from within an `onDeploy` hook of a Smart Contract, the output will look like this:

```
SmartContractName > onDeploy > [YOUR MESSAGE]
```

The `logger` is injected as part of the `dependencies` object, so we can use it like this:

```
contracts: {
  SimpleStorage: {
    onDeploy: async (dependencies) => {
      dependencies.logger.info('Hello from onDeploy!');
    }
  }
}
```

Which will result in 

```
SimpleStorage > onDeploy > Hello from onDeploy!
```

## Human readable Ether units

Embark supports human readable ether units in different places where Ether values can be configured. A human readable ether unit is the combination of any number value and any valid ether unit, such as `wei`, `kwei`, `Kwei`, `shannon`, `finney`, ... etc.

Let's take the simple Smart Contract configuration from the [configuring gas and gas price](#Configuring-gas-and-gas-price) section:

```
...
contracts: {
  SimpleStorage: {
    args: [100],
    gas: 800000,
    gasPrice: 5
  }
}
...
```

This can as well be written as:

```
...
contracts: {
  SimpleStorage: {
    args: [100],
    gas: '800 Kwei',
    gasPrice: 5
  }
}
...
```

Embark will take care of converting those units to their dedicated Wei values.
