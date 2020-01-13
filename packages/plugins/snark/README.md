# `embark-snark`

> Snark plugin for Embark

Use zkSNARKS in your DApp!
`embark-snark` uses `snarkjs` to handle the trusted setup, generate proofs and verify the proofs.
Compiles circom circuits and generate solidity proofs in an Embark DApp.

## Installation

In your embark dapp directory:

```
npm install embark-snark --save
```

Then add `embark-snark` to the plugins section in `embark.json`:

```json
"plugins": {
  "embark-snark": {
    "buildDir": "public/",
    "buildDirUrl": "/",
    "contractsBuildDir": "contracts/",
    "contractsJsonDirUrl": "/contracts/",
    "circuits": [
      "circuits/**"
    ],
    "circuitsConfig": {
      "multiplier": {
        "exclude": false
      },
      "withdraw": {
        "protocol": "groth"
      },
      "merkleTree": {
        "exclude": true
      }
    }
  }
}
```
### Plugin options
|Option|Description|Default|
|---|---|---|
|`buildDir`|Determines where the output of the snarks operations will be stored in the filesytem **relative to the dapp root**. This includes the compiled circuits, proving keys, and verification keys.|`public/snarks/`|
|`buildDirUrl`|Absolute URL path (must start with a `/`) of the build directory after it is served by the webserver. This will be used to build a URL for the browser to fetch needed snarks files.|`/snarks/`|
|`contractsBuildDir`|Determines where the generated snarks verification contract will be stored in the dapp, relative to the Dapp root.|`contracts/`|
|`contractsJsonDirUrl`|Absolute URL path (must start with a "/") of the JSON contract files directory after it is served by the webserver, relative to the Dapp's build directory (as specified by the top-level `buildDir` of `embark.json`).<br><br>For example, if we specify `buildDir: "public/snarks/"`in `embark.json` (top-level setting, different to the plugin config setting `buildDir`), Embark will put all JSON contract configs in `public/snarks/contracts`. When our webserver serves out the `public/` directory, it will serve it out on `/`, and therefore our JSON contract configs will be accessible via `/snarks/contracts/` URL.|`/snarks/contracts/`|
|`circuits`|Array of glob patterns indicating where the circuits live in our dapp, relative to the dapp root.|`["circuits/**"]`|
|`circuitsConfig`|Object with a key that matches the circuit name, and a value that is the configuration object for the circuit, see below.|`{ protocol: "groth", exclude: false }`|

### Circuit config options

|Option|Description|Default|
|---|---|---|
|`protocol`|zkSnarks protocol used to generate verification key, proving key, and proof.<br><br>Valid options are `"groth"`, `"kimleeoh"`, and `"original"`|`"groth"`|
|`exclude`|If `true`, circuit will be used for verification. This is useful when circuits need to import other (usually commonly used) circuits, but those circuits will not be used for starting a verfication.|`false`| 

## Usage

Let's say that we want to prove that we have two numbers that when multiplied together, equals 33, but we don't want anyone else using our DApp, nor the DApp logic, to know which numbers they are. Let's assume that those numbers are 3 and 11. 

First, create a circuit to does the multiplication, for example,
`circuits/multiplier.circom`:

```
template Multiplier() {
  signal private input a;
  signal private input b;
  signal output c; c <== a*b;
}

component main = Multiplier();
```
Notice that we have two private inputs and an output. In a more realistic circuit, there can also be public inputs that can be shared, as well as multiple outputs.

During `embark run`, Embark will compile the circuits, perform a trusted setup, generate solidity contracts to verify the proof, and deploy the contracts.

Now, in the Embark console, or in your DApp (ie in DevTools), you can now verify circuit inputs using:
```javascript
// syntax: EmbarkJS.Snark.<circuit>.verify(<inputs>)
const isValid = EmbarkJS.Snark.Multiplier.verify({a: 3, b: 11});
```

This will generate a witness using the secret inputs (which will contain the product 33) and a proof. Finally, **the proof and public signals** are submitted to the generated verification contract **on chain**, which will return `true` or `false`, indicating whether or not the proof and public signals are valid. In other words, the return value of the contract call determines if we can prove to other people, or the DApp logic, that we indeed have the secret inputs, without revealing the inputs themselves! It should be noted that **private inputs** will **not** be submitted to the chain, otherwise that would defeat the whole purpose!

Additionally, we can verify our inputs without submitting any data to the chain, by running a local proof:
```javascript
// syntax: EmbarkJS.Snark.<circuit>.verifyOffChain(<inputs>)
const isValid = EmbarkJS.Snark.Multiplier.verifyOffChain({a: 3, b: 11});
```

If, for example, you'd like the proof and public signals to be calculated, but verification run a different way, that can be done by calling:
```javascript
// syntax: EmbarkJS.Snark.<circuit>.calculate(<inputs>)
const { proof, publicSignals } = EmbarkJS.Snark.Multiplier.calculate({a: 3, b: 11});
```

## Requirements

- Embark 5.0.0-alpha.0 or later

Visit [framework.embarklabs.io](https://framework.embarklabs.io/) to get started with
[Embark](https://github.com/embarklabs/embark).
