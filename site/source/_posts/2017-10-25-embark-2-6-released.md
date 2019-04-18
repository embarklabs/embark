title: Embark 2.6.0 - web3.js 1.0, any version of web3.js & solc. Whisper 5 & much more
author: iuri_matias
categories:
  - announcements
layout: blog-post
---

## To Update to 2.6.0

Embark's npm package has changed from `embark-framework` to `embark`, this sometimes can create conflicts. To update, first uninstall embark-framework 1 to avoid any conflicts with `npm uninstall -g embark-framework` followed by `npm install -g embark`

to update from 2.5.2:

```
npm install -g embark@2.6
```

afterwards make sure `embark version` returns `2.6.0`.

## In this release

You no longer need to wait for new releases of embark when a new version of web3.js or solc comes out as this can be now configured. Embark will take care of downloading and using the new versions. You can specify a list of nodes the dapp should attempt to connect to (instead of being limited 1). Whisper 5 is now supported.

## Support for web3.js 1.0 and (nearly) ANY web3.js version

Embark now supports web3.js 1.0 by default, however you can now also specify exactly which version of web3.js you want to use so you can still use 0.19.0 or newer versions of 1.0.

in config/contracts.json

```
{
  "default": {
   ....
   "versions": {
      "web3.js": "1.0.0-beta"
    }
    ...
}
```

If ,for example, you wish to use 0.19.0 you can specify it in the config as `"web3.js": "0.19.0"`

## Support for ANY solc version

You can also configure the solc compiler you wish to use and it should work, so long that solc release does not contain breaking API changes.

`config/contracts.json`

```
{
  "default": {
   ....
   "versions": {
      "solc": "0.4.17"
    }
    ...
}
```

## Specify nodes DApp should attempt to connect to

You can specify which nodes your dapp should try to connect in each enviroment. "$WEB3" is a special keyword to specify the existing web3 object.
The following config would attempt to use the existing web3 object and if unavailable attempt to connect to localhost:8545

`config/contracts.json`

```
{
    "development": {
    ...
    "dappConnection": [
      "$WEB3",
      "http://localhost:8545"
    ],
   ...
}
```

## Specify node to deploy to

Before Embark would assume this would be the same as the one configured in blockchain.json which could lead to some ackward configs for some devs, this has now been changed so you can specify it in the contracts config.

`config/contracts.json`

```
{
    "development": {
    ...
    "deployment": {
      "host": "localhost",
      "port": 8545,
      "type": "rpc"
    },
   ...
}
```

## Specify node to connect whisper to

`config/communication.json`
```Javascript
{
  "default": {
    "enabled": true,
    "provider": "whisper",
    "available_providers": ["whisper", "orbit"],
    "connection": {
      "host": "localhost",
      "port": 8546,
      "type": "ws"
    }
  }
}
```

## Specify url to get assets

You can specify for each environment what IPFS node to get the assets from

`config/storage.json`

```Javascript
{
  ...
  "development": {
      ....
     "getUrl": "http://localhost:8080/ipfs/"
   },
   ...
  "livenet": {
      ....
      "getUrl": "https://gateway.ipfs.io/ipfs/"
   }
}
```

###  Plugin API changes

![plugin](http://icons.iconarchive.com/icons/elegantthemes/beautiful-flat/128/plugin-icon.png)

The following events are deprecated: abi-vanila, abi, abi-contracts-vanila, abi-vanila-deployment and have been renamed to code-vanila, code, code-contracts-vanila, code-vanila-deployment

plugins that use these events will get deprecation warnings, the deprecated events will be removed in 2.7.0


###  New Blockchain options

![geth](https://dappsforbeginners.files.wordpress.com/2015/02/ethereum-logo.jpg?w=200)


The following fields are now available at `config/blockchain.json` to enhance `embark blockchain`:

* "wsHost" - to specify the websocket host (default: localhost)
* "wsPort" - to specify the websocket port (default: 8546)
* "wsOrigins"- to specify the allowed origin of the websocket requests (default: FALSE), must be specified to something like http://localhost:8000 for the websocket connection to work.
* "wsApi" - to specify the apis available through websockets (default: ['eth', 'web3', 'net', 'shh'])

### Misc Bugfixes and Improvements

![bug fixes](http://i.imgur.com/L1r6Ac5.png)

* tests no longer need the requires and initialization and can be run directly with embark. however you can still use these requires to run it yourself with mocha or your own preferred test framework
* embark and mocha are no longer dependencies in the created dapp
* you can specify a test file with `embark test <filename>`
* tests no longer need testrpc to be installed first
* `EmbarkJS.isNewWeb3()` to detect if web3 1.0 is available
* demo app updated to use web3.js 1.0 and solc 0.4.17
* warn user when websocket or http CORS is not set
* tolerate solc compiler warnings, which could cause a crash sometimes


###  Thank you

A big thanks to all that contributed to this release including [Todd Baur](https://github.com/toadkicker) and Jacob Beauchamp.

### Chatroom

To discuss about Embark or Dapp development, please [join us at the gitter channel](https://gitter.im/iurimatias/embark-framework)


