# `embark-solc`

> Solc plugin for Embark

Compiles contracts using solc in an Embark DApp.

## Installation

In your embark dapp directory:

```
npm install embark-solc --save
```

Then add embark-solc to the plugins section in `embark.json`:

```json
"plugins": {
  "embark-solc": {
    "outputBinary": false
  }
}
```

- `outputBinary` can be specified to generate a .bin file that contains the binary of the contracts in hex. Default value is `false`.

## Requirements

- [Embark](https://www.npmjs.com/package/embark) 4.0.0 or higher
- [Solc](https://github.com/ethereum/solidity/releases) installed and available globally on your machine (h)

Visit [framework.embarklabs.io](https://framework.embarklabs.io/) to get started with
[Embark](https://github.com/embarklabs/embark).
