title: Naming System Configuration
layout: docs
---

We can configure different naming systems in Embark. In this guide we'll explore how this is done using the Ethereum Name Service.

## Configuration basics

Embark checks our configuration in `config/namesystem.js` by default. A naming system configuration isn't crucial to run Embark, so this only needs to be enabled when planing to use a naming system.

When using ENS as our provider, we can set the `register` section to pre-register sub-domains. This feature is  only available in the development environment:

```
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
