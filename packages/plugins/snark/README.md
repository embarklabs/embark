# `embark-snark`

> Snark plugin for Embark

Compiles circom circuits and generate solidity proofs in an Embark DApp.

## Installation

In your embark dapp directory:

```
npm install embark-snark --save
```

Then add embark-snark to the plugins section in `embark.json`:

```json
"plugins": {
  "embark-snark": {
    "circuits": ["app/circuits/**"],
    "inputs": {
      "multiplier": {
        "a": 3,
        "b": 11
      }
    }
  }
}
```

You can defined where your circuits will be and what are the inputs.

Now you can create your first circuits, for example,
`app/circuits/multiplier.circom`:

```
template Multiplier() {
  signal private input a;
  signal private input b;
  signal output c; c <== a*b;
}

component main = Multiplier();
```

Embark will now compile the circuits and generate a solidity contracts to
verify the proof as well as deploy it.

## Requirements

- Embark 5.0.0-alpha.0 or later

Visit [embark.status.im](https://embark.status.im/) to get started with
[Embark](https://github.com/embark-framework/embark).
