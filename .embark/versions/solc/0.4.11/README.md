[![Build Status](https://travis-ci.org/ethereum/solc-js.svg?branch=master)](https://travis-ci.org/ethereum/solc-js)

# solc-js
JavaScript bindings for the [Solidity compiler](https://github.com/ethereum/solidity).

Uses the Emscripten compiled Solidity found in the [solc-bin repository](https://github.com/ethereum/solc-bin).

## Node.js Usage

To use the latest stable version of the Solidity compiler via Node.js you can install it via npm:

```bash
npm install solc
```

### Usage on the Command-Line

If this package is installed globally (`npm install -g solc`), a command-line tool called `solcjs` will be available.

To see all the supported features, execute:

```bash
solcjs --help
```

Note: this commandline interface is not compatible with `solc` provided by the Solidity compiler package and thus cannot be
used in combination with an Ethereum client via the `eth.compile.solidity()` RPC method. Please refer to the
[Solidity compiler documentation](https://solidity.readthedocs.io/) for instructions to install `solc`.

### Usage in Projects

#### From early versions

It can also be included and used in other projects:

```javascript
var solc = require('solc');
var input = 'contract x { function g() {} }';
var output = solc.compile(input, 1); // 1 activates the optimiser
for (var contractName in output.contracts) {
	// code and ABI that are needed by web3
	console.log(contractName + ': ' + output.contracts[contractName].bytecode);
	console.log(contractName + '; ' + JSON.parse(output.contracts[contractName].interface));
}
```

#### From version 0.1.6

Starting from version 0.1.6, multiple files are supported with automatic import resolution by the compiler as follows:

```javascript
var solc = require('solc');
var input = {
	'lib.sol': 'library L { function f() returns (uint) { return 7; } }',
	'cont.sol': 'import "lib.sol"; contract x { function g() { L.f(); } }'
};
var output = solc.compile({sources: input}, 1);
for (var contractName in output.contracts)
	console.log(contractName + ': ' + output.contracts[contractName].bytecode);
```

Note that all input files that are imported have to be supplied, the compiler will not load any additional files on its own.

#### From version 0.2.1

Starting from version 0.2.1, a callback is supported to resolve missing imports as follows:

```javascript
var solc = require('solc');
var input = {
	'cont.sol': 'import "lib.sol"; contract x { function g() { L.f(); } }'
};
function findImports(path) {
	if (path === 'lib.sol')
		return { contents: 'library L { function f() returns (uint) { return 7; } }' }
	else
		return { error: 'File not found' }
}
var output = solc.compile({sources: input}, 1, findImports);
for (var contractName in output.contracts)
	console.log(contractName + ': ' + output.contracts[contractName].bytecode);
```

The `compile()` method always returns an object, which can contain `errors`, `sources` and `contracts` fields. `errors` is a list of error mesages.

#### From version 0.4.11

Starting from version 0.4.11 there is a new entry point named `compileStandardWrapper()` which supports Solidity's [standard JSON input and output](https://solidity.readthedocs.io/en/develop/using-the-compiler.html#compiler-input-and-output-json-description). It also maps old compiler output to it.

**Note:**
If you are using Electron, `nodeIntegration` is on for `BrowserWindow` by default. If it is on, Electron will provide a `require` method which will not behave as expected and this may cause calls, such as `require('solc')`, to fail.

To turn off `nodeIntegration`, use the following:

```javascript
new BrowserWindow({
	webPreferences: {
		nodeIntegration: false
	}
});
```

### Using a Legacy Version

In order to compile contracts using a specific version of Solidity, the `solc.useVersion` method is available. This returns a new `solc` object that uses a version of the compiler specified. **Note**: version strings must match the version substring of the files available in `/bin/soljson-*.js`. See below for an example.

```javascript
var solc = require('solc');
// by default the latest version is used
// ie: solc.useVersion('latest')

// getting a legacy version
var solcV011 = solc.useVersion('v0.1.1-2015-08-04-6ff4cd6');
var output = solcV011.compile('contract t { function g() {} }', 1);
```

If the version is not available locally, you can use `solc.loadRemoteVersion(version, callback)` to load it directly from GitHub.

You can also load the "binary" manually and use `setupMethods` to create the familiar wrapper functions described above:
`var solc = solc.setupMethods(require("/my/local/soljson.js"))`.

### Using the Latest Development Snapshot

By default, the npm version is only created for releases. This prevents people from deploying contracts with non-release versions because they are less stable and harder to verify. If you would like to use the latest development snapshot (at your own risk!), you may use the following example code.

```javascript
var solc = require('solc');

// getting the development snapshot
solc.loadRemoteVersion('latest', function(err, solcSnapshot) {
	if (err) {
		// An error was encountered, display and quit
	}
	var output = solcSnapshot.compile("contract t { function g() {} }", 1);
});
```

### Linking Bytecode

When using libraries, the resulting bytecode will contain placeholders for the real addresses of the referenced libraries. These have to be updated, via a process called linking, before deploying the contract.

The `linkBytecode` method provides a simple helper for linking:

```javascript
bytecode = solc.linkBytecode(bytecode, { 'MyLibrary': '0x123456...' });
```

Note: in future versions of Solidity a more sophisticated linker architecture will be introduced.  Once that changes, this method will still be usable for output created by old versions of Solidity.

### Updating the ABI

The ABI generated by Solidity versions can differ slightly, due to new features introduced.  There is a tool included which aims to translate the ABI generated by an older Solidity version to conform to the latest standard.

It can be used as:
```javascript
var abi = require('solc/abi');

var inputABI = [{"constant":false,"inputs":[],"name":"hello","outputs":[{"name":"","type":"string"}],"payable":false,"type":"function"}];
var outputABI = abi.update('0.3.6', inputABI)
// Output contains: [{"constant":false,"inputs":[],"name":"hello","outputs":[{"name":"","type":"string"}],"payable":true,"type":"function"},{"type":"fallback","payable":true}]

```
