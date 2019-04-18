title: Naming System (ENS) in JavaScript
layout: docs
---

In order to improve the user experience of decentralized applications that deal with smart contracts or Ethereum addresses in general, it's a good practice to take advantage of the [Ethereum Name Service](https://ens.domains/) and its registered, human-readable names. Embark provides APIs to either resolve a given domain to its corresponding address, or lookup a registered name by a given address.

Let's take a look at how this is done.

## Resolving a Domain to an address

Resolving a domain to its corresponding address is done by calling `EmbarkJS.Names.resolve()`, which takes the domain in question as first argument and a callback function that has access to the resolved address as a second argument:

```
EmbarkJS.Names.resolve('ethereum.eth', (err, result) => {
  console.log('ENS address', result)
});
```

If you prefer using Promises, Embark has got you covered! `EmbarkJS.Names.resolve()` returns a promise that resolves with the corresponding address, or an error message in case the given domain doesn't resolve to an address:

```
EmbarkJS.Names.resolve("ethereum.eth").then(address => {
  console.log("the address for ethereum.eth is: " + address);
})
```

## Reverse resolve an ENS domain

Similar to resolving addresses, looking up domains is really just a matter of calling `EmbarkJS.Names.lookup`, which takes an address as argument. Just like `EmbarkJS.Names.resolve`, a callback can be used to get notified whether the lookup was successful or not:

```
EmbarkJS.Names.lookup("0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359", (err, name) => {
  console.log("the domain is: " + name);
})
```

Guess what, `EmbarkJS.Names.lookup()` also returns a Promise in case you prefer using those over callbacks:

```
EmbarkJS.Names.lookup("0xfb6916095ca1df60bb79ce92ce3ea74c37c5d359").then(name => {
  console.log("the domain is: " + name);
})
```

## Registering a subdomain

This enables you to register some others sub-domains. This is mostly for demo purposes as it is only available in development.

```
EmbarkJS.Names.registerSubDomain('newsubdomain', '0x4a17f35f0a9927fb4141aa91cbbc72c1b31598de', (err, transaction) => {
  console.log(`Successfully registered with ${transaction.gasUsed} gas`);
});
```
