title: Special Imports
layout: docs
---

Depending on which language for developing Smart Contracts is used, Embark supports special import paths. In this guide we'll discuss the various ways of importing Smart Contract source code in other Smart Contract files.

{% notification info 'Scope of this guide' %}
The following features are currently only supported for Smart Contracts written in the Solidity programming language. If you're using another language, such as Vyper, these features may not be available.
{% endnotification %}

## Importing files

If using Solidity it's possible to import other Smart Contract files inside a source file from the application's folders that are not explicitly defined in the `contracts` property of `embark.json`.

```
import "another_folder/another_test.sol";
```

## Importing from `node_modules`

Embark also supports convenient imports from installed `node_modules`. Just specify the package name including the path to the Solidity file you wish to import.

```
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
```

## Importing from remote paths

Source files can even be imported straight from Git, Github, IPFS, Swarm  or via HTTP(S):

```
import "git://github.com/status/contracts/contracts/identity/ERC725.sol#develop";
import "github.com/status/contracts/contracts/identity/ERC725.sol";
import "https://github.com/OpenZeppelin/openzeppelin-solidity/blob/master/contracts/ownership/Ownable.sol";
import "bzz:/1ffe993abc835f480f688d07ad75ad1dbdbd1ddb368a08b7ed4d3e400771dd63"
```

