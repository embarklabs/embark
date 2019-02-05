Embark-Slither
======

Plugin for [Embark](https://github.com/embark-framework/embark) to analyse solidity source with [slither](https://github.com/trailofbits/slither)

Installation
======

In your embark dapp directory:

```npm install embark-slither --save```

or if using `yarn`:

```yarn add embark-slither```

then add embark-slither to the plugins section in ```embark.json```:

```Json
  "plugins": {
    "embark-slither": {}
  }
```

Embark will now execute slither after each compilation.

Requirements
======

- Embark 4.0.0 or higher
- Slither