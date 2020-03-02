# `embark-quorum`

> Quorum blockchain client plugin for Embark

`embark-quorum` is an Embark plugin that allows &ETH;Apps to **connect to** Quorum blockchains. This plugin will not start a Quorum node or nodes automatically as Embark does with other clients.

Using this plugin, you can:
 - deploy contracts publically and privately to a Quorum network using the Tessera private transaction manager.
 - send public and private transactions on a Quorum network using the Tessera private transaction manager.

## Overview
To use the Embark Quorum plugin, you'll need to do the following, which we'll cover in more detail in the sections below:
1. [Initialise and run a Quorum network](#1-initialise-and-run-a-quorum-network), such as the [7nodes example](https://github.com/jpmorganchase/quorum-examples/tree/master/examples/7nodes)
2. [Install the `embark-quorum` plugin in your &ETH;App](#2-install-the-embark-quorum-plugin-in-your-&ETH;App)
3. [Configure your &ETH;App's blockchain config](#3-configure-your-&ETH;Apps-blockchain-config)
4. [Configure your &ETH;App's contract config (if necessary)](#4-configure-your-&ETH;Apps-contract-config)
5. [Run Embark and deploy a private contract](#5-run-embark-and-deploy-a-private-contract)
6. [Sending a private transaction](#6-sending-a-private-transaction)

## 1. Initialise and run a Quorum network
In order to get a Quorum network up quickly for development, the easiest path is to download the Quorum/Tessera binaries and use them to run the cloned 7nodes example.
1. Download the latest Quorum binary from https://github.com/jpmorganchase/quorum/releases. Let's say it was downloaded to `/repos/jpmorganchase/quorum/build/bin/geth`.
2. Update your `PATH` environment variable such that `geth` points to Quorum geth:
```
export PATH=/repos/jpmorganchase/quorum/build/bin:$PATH
```
3. Download the latest Tessera jar (`tessera-app-{version}-app.jar`, ie `tessera-app-0.10.3-app.jar`) from https://github.com/jpmorganchase/tessera/releases.
4. Update your `TESSERA_JAR` environment variable to point to the downloaded Tessera jar:
```
export TESSERA_JAR=/path/to/tessera-app-0.10.3-app.jar
```
5. Clone the 7nodes example repo:
```
git clone https://github.com/jpmorganchase/quorum-examples
cd examples/7nodes
```
6. Initialise Quorum using the desired consensus (`istanbul`, `raft`, `clique`):
```
# ./{consensus}-init.sh
./istanbul-init.sh
```
7. Start Quorum using the desired consensus from step 6:
```
# ./{consensus}-start.sh tessera
./istanbul-start.sh
```
  > **NOTE:** the default 7nodes example does not start Quorum geth with WebSockets. We can get around this by updating `./istanbul-start.sh` before executing it, as per https://github.com/jpmorganchase/quorum-examples/pull/221. As an alternative, clone [the fork with these changes](https://github.com/emizzle/quorum-examples) (on the `7nodes-websocket-support` branch) in Step 5 instead.

After a few moments, you should have 7 Quorum nodes up and running.

To stop the network:
```
./stop.sh
```

For more information on how to get the 7nodes example up and running, including information on using Vagrant and Docker, see https://github.com/jpmorganchase/quorum-examples.

## 2. Install the `embark-quorum` plugin in your &ETH;App

### Creating a &ETH;App if needed
First, ensure you have a &ETH;App set up. We will be using the Embark's demo &ETH;App in this README, which can be created using `embark demo`:
```
# /bin/bash

embark demo
cd embark_demo
```

For more information on how to get started with the Embark Demo, view our [Quick Start guide](https://framework.embarklabs.io/docs/quick_start.html).

### Installing `embark-quorum` in your &ETH;App
To install `embark-quorum` in to our &ETH;App, we can add `embark-quorum` to our `packages.json`, then run `npm` or `yarn`:
```
# package.json
"dependencies": {
  "embark-quorum": "5.3.0"
}
```
Then install the package with your package manager.
```
# /bin/bash
npm i
// OR
yarn
```
Next, update our &ETH;App's `embark.json` to include the `embark-quorum` plugin:
```
# embark.json
"plugins": {
  "embark-quorum": {}
}
```


## 3. Configure your &ETH;App's blockchain config
We'll need to update our `blockchain.js` configuration to instruct Embark on how to connect to the seven Quorum nodes we now have running.

The best option is to create an environment for each node in the network, so that we can connect to each node individually. The `rpcPort` and `wsPort` are determined by the `./{consensus}-init.sh` script run in step 1.6.

Notice that by setting the `tesseraPrivateUrl` in the `default` environment, it is shared by all the environments defined.

```
# config/blockchain.js

module.exports = {
  // default applies to all environments
  default: {
    enabled: true,
    client: 'quorum',
    clientConfig: {
      miningMode: 'dev', // Mode in which the node mines. Options: dev, auto, always, off
      tesseraPrivateUrl: 'http://localhost:9081'
    }
  },

  nodeone: {
    clientConfig: {
      rpcPort: 22000,
      wsPort: 23000
    }
  },

  nodetwo: {
    clientConfig: {
      rpcPort: 22001,
      wsPort: 23001
    }
  },

  nodethree: {
    clientConfig: {
      rpcPort: 22002,
      wsPort: 23002
    }
  },

  nodefour: {
    clientConfig: {
      rpcPort: 22003,
      wsPort: 23003
    }
  },

  nodefive: {
    clientConfig: {
      rpcPort: 22004,
      wsPort: 23004
    }
  },
  nodesix: {
    clientConfig: {
      rpcPort: 22005,
      wsPort: 23005
    }
  },
  nodeseven: {
    clientConfig: {
      rpcPort: 22006,
      wsPort: 23006
    }
  }
};
```

## 4. Configure your &ETH;App's contract config
We'll need to update our `contracts.js` configuration to instruct Embark on how to deploy our contracts.

There are two important things to notice in this configuration. First, notice that `nodeone` has the field `privateFor`. This is telling Quorum to deploy the contract privately to Node 7, as indicated by Node 7's public key in the `privateFor` field. The means Node 1 and Node 7 will be privy to this contract's values once deployed.

Also notice that we include `skipBytecodeCheck: true` for all nodes that we *assume should have the contract deployed in the **network**, but not deployed to that **node***. In our example, Node 1 doesn't need `skipBytecodeCheck` because it is deploying the contract and can let Embark handle tracking of the contract deploys. Node 7 also doesn't need this check because Node 1 will have privately deployed the contract to Node 1 and Node 7, so we know the bytecode will exist on Node 7. However, all other Nodes need `skipBytecodeCheck: true`, because the bytecode will **not exist** on those nodes and when Embark connects to any of those environments, we are going to rely on Embark's deployment tracking feature to determine if the contract has been deployed to the network, **instead of** checking to see if the bytecode for that contract exists on the node Embark is connected to. Please [check out the docs](https://framework.embarklabs.io//docs/contracts_configuration.html#Skipping-bytecode-check) for more information on this topic.

```
# config/contracts.js

module.exports = {
  // default applies to all environments
  default: {
    // order of connections the DApp should connect to
    dappConnection: [
      "$EMBARK",
      "$WEB3",  // uses pre existing web3 object if available (e.g in Mist)
      "ws://localhost:8546",
      "http://localhost:8545"
    ],
    gas: "auto",
  },

  nodeone: {
    deploy: {
      SimpleStorage: {
        fromIndex: 0,
        args: [100],
        privateFor: ["ROAZBWtSacxXQrOe3FGAqJDyJjFePR5ce4TSIzmJ0Bc="]
      }
    }
  },
  nodetwo: {
    deploy: {
      SimpleStorage: {
        skipBytecodeCheck: true
      }
    }
  },
  nodethree: {
    deploy: {
      SimpleStorage: {
        skipBytecodeCheck: true
      }
    }
  },
  nodefour: {
    deploy: {
      SimpleStorage: {
        skipBytecodeCheck: true
      }
    }
  },
  nodefive: {
    deploy: {
      SimpleStorage: {
        skipBytecodeCheck: true
      }
    }
  },
  nodesix: {
    deploy: {
      SimpleStorage: {
        skipBytecodeCheck: true
      }
    }
  },
  nodeseven: {}
};
```

## 5. Run Embark and deploy a private contract
Now that we have our &ETH;App set up, let's run Embark and see the private contract deployment in action. We are going to deploy the `SimpleStorage` contract privately between Nodes 1 and 7 (based on the `privateFor` parameter specified in the contract configuration for the `nodeone` environment), and witness how we can only view the contract's values in Nodes 1 and 7, and not in Nodes 2 - 5.

First, let's run Embark in console mode in our `nodeone` environment, ensuring we connect to Node 1 in our 7nodes example:
```
# /bin/bash

embark console nodeone
```
You should see all the normal output of `embark run`, including information on how the contract `SimpleStorage` was deployed:
```
compiling solidity contracts...
deploying contracts
Deploying SimpleStorage with 151414 gas at the price of 0 Wei. Estimated cost: 0 Wei  (txHash: 0xecb96cebf2a4da17206d8b225b77f2a84e3ec2ae1a10cd3f95ddc094381ec5d1)
SimpleStorage deployed at 0x9d13C6D3aFE1721BEef56B55D303B09E021E27ab using 0 gas (txHash: 0xecb96cebf2a4da17206d8b225b77f2a84e3ec2ae1a10cd3f95ddc094381ec5d1)
finished deploying contracts
```
Once the &ETH;App is finished webpacking, you should see the console prompt:
```
Embark (nodeone) >
```
In this prompt, enter `SimpleStorage.get()` so we can find out what our current value stored in the contract is:
```
Embark (nodeone) > SimpleStorage.get()
# 100
```
We can see that the value returned is the value we provided in our `SimpleStorage` constructor `args` in the contracts configuration. So far, so good.

Now, let's kill our instace of Embark with `Ctrl+c`, and then spin up a new instance in the `nodeseven` environment.
```
<ctrl+c>
embark console nodeseven
```
The output, this time, will be a little bit different. Notice that Embark understands that the contract has been deployed to Node 7 (due to the bytecode check):
```
deploying contracts
SimpleStorage already deployed at 0x9d13C6D3aFE1721BEef56B55D303B09E021E27ab
finished deploying contracts
```
Now, do the same thing as before and retrieve the value stored in the contract:
```
Embark (nodeone) > SimpleStorage.get()
# 100
```
Again, as expected, we get the value of 100, matching the constructor arguments. This is expected because Node 1 deployed the `SimpleStorage` contract privately between nodes 1 and 7.

Let's take this one step further and check the value stored in `SimpleStorage` on a node that was not included in the private contract deploy.

Exit the current Embark instance with `ctrl+c`, then start up a new instance in the `nodetwo` environment:
```
<ctrl+c>
embark console nodetwo
```
Notice the warning that the bytecode check is skipped, and also that Embark knows the contract has already been deployed, **even though the bytecode doesn't exist on Node 2**:
```
compiling solidity contracts...
deploying contracts
WARNING: Skipping bytecode check for SimpleStorage deployment. Performing an Embark reset may cause the contract to be re-deployed to the current node regardless if it was already deployed on another node in the network.
SimpleStorage already deployed at 0x9d13C6D3aFE1721BEef56B55D303B09E021E27ab
finished deploying contracts
```
Again, let's see now what Node 2 has stored for the `SimpleStorage` contract value:
```
Embark (nodetwo) > SimpleStorage.get()
# 0
```
The result is `0`, which is exepcted because Node 2 does not contain the bytecode for `SimpleStorage` and does not have its values stored in its Ethereum state.

## 6. Sending a private transaction
Let's see how the `embark-quorum` plugin allows us to send private transactions.

First, run an Embark console in the `nodeone` environment to see what the current value of the `SimpleStorage` contract is.

```
# /bin/bash

embark console nodeone
```
Once started, get our contract value in the console prompt:
```
Embark (nodeone) > SimpleStorage.get()
# 100
```
Now, let's update this value only for Node 7. In the console, we're going to send a private transaction between Node 1 and Node 7. This transaction is simply going to set the `SimpleStorage` value to `333` by calling the `SimpleStorage.set(333)` method in a transaction. Run each of these lines individually in the console:
```
Embark (nodeone) > from = web3.eth.defaultAccount
Embark (nodeone) > privateFor = ['ROAZBWtSacxXQrOe3FGAqJDyJjFePR5ce4TSIzmJ0Bc=']
Embark (nodeone) > await SimpleStorage.methods.set(333).send({ from, privateFor })
```
We can check that the transaction set our `SimpleStorage` value to `333`:
```
Embark (nodeone) > SimpleStorage.get()
# 333
```
Now, let's check Node 7:
```
<ctrl+c>
embark console nodeseven
```
Then, in the console prompt:
```
Embark (nodeseven) > SimpleStorage.get()
# 333
```
Great! We have privately set our `SimpleStorage` contract value only in Node 7.


## Conclusion
Now you should have a good idea of how to run a Quorum network and use Embark to deploy public and private contracts, and send public and private transactions.

In addition to running on a network of multiple Quorum nodes, `embark-quorum` works with any number of Quorum nodes, including one.

Please feel free to explore all the possibilities of Quorum and Embark in your own &ETH;App, and [report any issues found](https://github.com/embarklabs/embark/issues).
---

Visit [framework.embarklabs.io](https://framework.embarklabs.io/) to get started with
[Embark](https://github.com/embarklabs/embark).
