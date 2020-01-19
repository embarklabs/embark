# `embark-nethermind`

> Nethermind blockchain client plugin for Embark


## Quick docs

To configure the Netherminds client, you can use the Embark configs as always, or for more control, use the Nethermind config files.
To change them, go in your Netherminds directory, then in `configs/`. There, you will see all the configuration files for the different networks.
If you ever need to run a different network than dev, testnet or mainnet, you can change it in the Embark blockchain configuration by changing the `networkType` to the name of the config file, without the `.cfg`.
Eg: For the Goerli network, just put `networkType: 'goerli`
Note: The dev mode of Netherminds is called `ndm` and the config file is `ndm_consumer_local.cfg`. Using `miningMode: 'dev'` automatically translates to using that config file.

## Websocket support

Even though Nethermind supports Websocket connections, it does not support `eth_subscribe`, so you will not be able to use contract events.
Also, please note that you will need to change the `endpoint` in the blockchain configuration to `ws://localhost:8545/ws/json-rpc` when working in local. Do change the port or the  host to whatever you need.

Visit [framework.embarklabs.io](https://framework.embarklabs.io/) to get started with
[Embark](https://github.com/embarklabs/embark).
