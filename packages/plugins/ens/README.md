# `embark-ens`

> Implements ENS support in Embark

This module:
* registers console commands to interact with ENS
* deploys & setups ENS contracts depending on the network
* implements ENS support in EmbarkJS
* setups generated code acording to the config

## API

**command: `ens:resolve`** - _returns the address of an ens name_

arguments:

* `name` - ens name to resolve

response:

* `error` - if an error occurs, null otherwise
* `address` - address associated to the ens `name` given

**command: `ens:isENSName`** - _checks is it's a (valid) ENS name_

arguments:

* `name` - ens name to validate

response:

* `error` - if an error occurs, null otherwise
* `result` - true/false depending if `name` given is a valid ens name

**command: `storage:ens:associate`** - _associates an hash to an ENS domain_

arguments:

* `options`
  * `name` - ens name
  * `storageHash` - hash to associate

response:

* `error` - if an error occurs, null otherwise

## Web API

**endpoint: GET `/embark-api/ens/resolve`** - _returns the address of an ens name_

arguments:

* `name` - ens name to resolve

response:

```
{
  address: <address of ens name>
}
```

**endpoint: GET `/embark-api/ens/lookup`** - _returns the ens name of an address_

arguments:

* `address` - address to query

response:

```
{
  name: <ens name of address>
}
```

**endpoint: POST `/embark-api/ens/register`** _registers a domain or subdomain_

arguments:

* `subdomain` - ens domain
* `address` - address to associate

response:

```
{
  name: <ens name>
  address: <address>
}
```

## Dependencies

* async
* eth-ens-namehash
* embarkjs.utils
  * secureSend
* embark utils
  * AddressUtils
  * hashTo32ByteHexString
  * recursiveMerge
