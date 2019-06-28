Embark-Solc
======

Plugin for [Embark](https://github.com/embark-framework/embark) to compile contracts using solc

## Installation


In your embark dapp directory:

```npm install embark-solc --save```

then add embark-solc to the plugins section in `embark.json`:

```Json
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

