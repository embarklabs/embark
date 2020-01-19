# `embark-compiler`

> Embark compiler module

Abstracts the compiler interface and exposes a plugin api to register contract
extensions and how to handle them. It accepts command requests to compile and
returns the aggregated compilation result.

## API

**command: `compiler:contracts:compile`**

arguments:

* `contractFiles` - <array of embark File Objects>
* `options` - <object> config object `{isCoverage: boolean (default: false)}`

response:

* `error`
* `compiledObject` - compilation result
```
  {
    runtimeBytecode: <deployed bytecode>
    realRuntimeByteCode: <deployed bytecode without swarm hash>
    code: <bytecode>
    abiDefinition: <abi object>

    swarmHash: (optional)
    gasEstimates: (optional)
    functionHashes: (optional)
    filename: (optional) <contract relative filename>
    originalFilename: (optional) <contract real filename>
  }
```

example:

```
import { File } from 'src/lib/core/file.js';
const contractFiles = [(new File({path: "simplestorage.sol", type: "custom", resolver: (cb) => { return cb(".. contract code...") }}))];

embark.events.request("compiler:contracts:compile", contractFiles, {}, (err, compiledObject) => {
})

```

## Plugins

This module enables the `registerCompiler` plugin API. see [documentation](https://framework.embarklabs.io/docs/plugin_reference.html#embark-registerCompiler-extension-callback-contractFiles-doneCallback)

***embark.registerCompiler***

arguments:

* `extension` - extension of the contract language (e.g `.sol`)
* response callback
  * `contractFiles`: filenames matching the extension
  * `callback(error, compiledObject)`

Visit [framework.embarklabs.io](https://framework.embarklabs.io/) to get started with
[Embark](https://github.com/embarklabs/embark).
