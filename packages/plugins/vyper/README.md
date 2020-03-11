# `embark-vyper`

> Embark wrapper for the Vyper compiler

## Step 1. Install the Embark Vyper plugin
Installing the [Embark Vyper](https://github.com/embarklabs/embark/blob/master/packages/plugins/vyper/README.md) plugin in our &ETH;App is extremely simple:
1. Add the `embark-vyper` package to your &ETH;App:
```
yarn add embark-vyper
# OR
npm i embark-vyper
```
2. Add the `embark-vyper` plugin to `embark.json`:
```
// embark.json

// ...
"plugins": {
  "embark-ipfs": {},
  "embark-swarm": {},
  "embark-whisper-geth": {},
  "embark-geth": {},
  "embark-parity": {},
  "embark-profiler": {},
  "embark-graph": {},
  "embark-vyper": {} // <====== add this!
},
// ...
```

## Step 2. Add a Vyper contract to your &ETH;App
For the purposes of this guide, let's delete the existing `SimpleStorage` Solidity contract that comes with the Embark Demo by default if it exists:
```
rm -rf contracts/simple_storage.sol
```
Next, let's create a Vyper contract in the `contracts` folder of our &ETH;App, ie `contract/SimpleStorage.vy` (case is important):
```
# contracts/SimpleStorage.vy

storedData: public(int128)

@public
def __init__(_x: int128):
  self.storedData = _x

@public
def set(_x: int128):
  self.storedData = _x
```
The function of this contract is simple: upon creation (deployment), it will store the value we initially give it during deployment. We also have access to a `set()` that will allow to set the value stored in the contract.

### Changing the contract filename
Because Vyper's constructor is called `__init__`, Embark must take the contract class name from the file name. If you'd prefer to change the name of your contract file to something else like `contracts/simple_storage.vy`, you'll need to update `config/contract.js` to allow Embark to match a contract configuration to a contract file:
```
// config/contracts.js

module.exports = {
  default: {
    // ...
    deploy: {
      simple_storage: {
        fromIndex: 0,
        args: [100]
      }
    }
    // ...
  }
}
```
Please see the Embark [smart contract configuration documentation](https://framework.embarklabs.io/docs/contracts_configuration.html) for more information on how to configure contracts in Embark.

## Step 3. Run Embark
Now that we have installed and configured everything, let's run Embark and watch the magic!
```
embark run --nodashboard --nobrowser
```
Assuming we kept the file name `SimpleStorage.vy` from step 4, we should see the following output in the console:
```
compiling Vyper contracts...
deploying contracts
Deploying SimpleStorage with 144379 gas at the price of 2000000000 Wei. Estimated cost: 288758000000000 Wei  (txHash: 0x370a864b12b1785b17180b2a10ec2f941a15638eeffadfecf5bbe68755a06f14)
SimpleStorage deployed at 0x5Baf4D88bC454537C51CEC7568a1E23400483abc using 135456 gas (txHash: 0x370a864b12b1785b17180b2a10ec2f941a15638eeffadfecf5bbe68755a06f14)
```

### Troubleshooting
There are a few common issues you may experience when Embark attempts to compile and deploy your Vyper contracts.

#### Vyper is not installed on your machine
```
Vyper is not installed on your machine
You can install it by visiting: https://vyper.readthedocs.io/en/latest/installing-vyper.html
```
This means that the binary `vyper` cannot be found on your machine. If you're running *nix, you can verify this by running:
```
which vyper
# expected output: path/to/virtual-env/bin/vyper
# actual output: vyper not found
```
If `vyper` was [installed in a virtual environment](https://vyper.readthedocs.io/en/latest/installing-vyper.html#creating-a-virtual-environment), you may have forgotten to active the environment, ie:
```
source path/to/vyper-env/bin/activate
```
If `vyper` was not installed in a virual environment, it means either your `PATH` environment variable needs to be updated to point to the directory where the `vyper` binary is installed. You can inspect your `PATH` environment variable by:
```
echo $PATH
```
And update it with the path to *the directory containing* the `vyper` binary using:
```
export PATH=/path/to/vyper/dir:$PATH
```

#### Error deploying contract
```
SimpleStorage has no code associated
did you mean "simple_storage"?
deploying contracts
Error deploying contract simple_storage
[simple_storage]: Invalid number of parameters for "constructor". Got 0 expected 1!
Error deploying contracts. Please fix errors to continue.
```
This means that the contract `simple_storage` is a file in `contracts/` and expected to be deployed by Embark, but is not configured for deploy in the contracts configuration. This could be the result of changing the filename of the Vyper contract to `simple_storage.vy`, but not updating the contracts configuration, as outlined in [step 2](#Changing-the-contract-filename).


Visit [framework.embarklabs.io](https://framework.embarklabs.io/) to get started with
[Embark](https://github.com/embarklabs/embark).
