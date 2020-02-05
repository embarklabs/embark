title: Naming System Configuration
layout: docs
---

We can configure different naming systems in Embark. In this guide we'll explore how this is done using the Ethereum Name Service.

## Configuration basics

Embark checks our configuration in `config/namesystem.js` by default. A naming system configuration isn't crucial to run Embark, so this only needs to be enabled when planing to use a naming system.

When using ENS as our provider, we can set the `register` section to pre-register sub-domains.

This feature is  only available in the development environment:

```javascript
module.exports = {
  default: {
    enabled: true,
    available_providers: ['ens', 'ipns'],
    provider: 'ens',
    register: {
      rootDomain: 'embark.eth',
      subdomains: {
        // List of subdomains.
        // The key is the name (eg: status -> status.embark.eth)
        // The value is the address to where the subdomain points
        'status': '0x1a2f3b98e434c02363f3dac3174af93c1d690914'
      }
    }
  }
};
```

### Parameters

- `rootDomain`: The ENS domain. It gets registered using your default account
- `subdomains`: Object were the key is the subdomain name and the value is the address to set to it

## Special configurations

### $Contracts

For subdomains, you can set the address as one of your contracts address using it's name prefixed by a dollar sign (`$`).

```
subdomains: {
  'contract': '$MyContract'
}
```

Now, assuming your `rootDomain` is `embark.eth`, `contract.embark.eth` will resolve to the deployed address of MyContract.

### $accounts

Similarly to `$Contract`, using `$accounts` let's you set the subdomain address to one of your accounts address.

```
subdomains: {
  'account': '$accounts[0]'
}
```

Now, assuming your `rootDomain` is `embark.eth`, `account.embark.eth` will resolve to address of your first (index 0) account (aka `defaultAccount`).
