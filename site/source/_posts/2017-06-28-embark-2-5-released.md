title: Embark 2.5.0
summary: Today we're excited to announce the release of Embark 2.5.0! Read on for what's in it.
author: iuri_matias
categories:
  - announcements
layout: blog-post
---

## To Update to 2.5.0

Embark's npm package has changed from `embark-framework` to `embark`, this sometimes can create conflicts. To update, first uninstall embark-framework 1 to avoid any conflicts with `npm uninstall -g embark-framework` followed by `npm install -g embark`

to update from 2.4.2:

```
npm install -g embark@2.5
```

afterwards make sure `embark version` returns `2.5.0`.

## In this release

This release updates to the lastest dependencies, fixes a few things and has a lot of work under the hood necessary for future releases.

## Updates

* support for geth 1.6.5
* updated to use web3.js 0.19.11
* updated to use solc 0.4.11

## Misc Bugfixes and Improvements

* `embark new` will now prompt for the dapp name if not specified as `embark new <yourDappName>`
* embark.js: `ContractName.new()` as been added as an alias for `ContractName.deploy()`
* embark.js: a method to easily send ether to a contract has been added: `ContractName.send(value, unit, options)` e.g `ContractName.send(2, "ether", {from: web3.eth.accounts[1]})`
* orbit: Fix for orbit to make it work if the blockchain component is disabled
* orbit: Use default config for orbit it none is specified in the config file
* Demo app now has warning message for incompatible whisper versions
* the JSON files of the contracts are now being outputted at dist/contracts/ (experimental)
* whisper: Dashboard now displays the whisper version of the node
* plugin API: extensions can now also be added as directories within the dapp directory
* plugin API: plugins can now register a component to be displayed in the dashboard. e.g:

```Javascript
embark.registerServiceCheck('PluginService', function(cb) {
  if (someFunctionThatChecksTheService()) {
      cb({name: "MyServiceName", status: "on"});
  } else {
    cb({name: "MyServiceName", status: "off"});
  }
});
```

##  Thank you

A big thanks to all that contributed to this release including [Nathan Hernandez](https://github.com/nathanph), [Antonio Tenorio-Fornés](https://github.com/atfornes), [Jon Johnson](https://github.com/jonjonsonjr), Andy Nogueira,  [roo2](https://github.com/roo2), [Carl Mönnig](https://github.com/carlmon), [Michael Yeates](https://github.com/michaeljyeates), [Todd Baur](https://github.com/toadkicker), [黄俊钦](https://github.com/imtypist), [Ramiro Moreira](https://github.com/RamiroMoreira), [gregg dourgarian](https://github.com/greggdourgarian)

## Chatroom

To discuss about Embark or Dapp development, please [join us at the gitter channel](https://gitter.im/iurimatias/embark-framework)

