title: What's new in Embark 4.1
summary: "Embark 4.1 is out and in this article we'll be looking into some of new features."
author: pascal_precht
categories:
  - announcements
layout: blog-post
alias: news/2019/07/22/whats-new-in-embark-4.1/
---

After four months of development we're happy to tell you that we've released Embark 4.1 which comes with tons of bug fixes and a lot of new features. In this post we'll take a closer look at some of these features, however as always, we recommend having a look at our [change log](https://github.com/embarklabs/embark/blob/master/CHANGELOG.md) to get a more detailed overview of what has landed in Embark's latest release. Let's get right to it!

## New `beforeDeploy` hook

In Embark 4, we've introduced a handful of new [deployment hooks](https://embark.status.im/docs/contracts_configuration.html#Deployment-hooks) and with 4.1, we're expanding the APIs from there. The new `beforeDeploy` hook lets you run an action either before all of your Smart Contracts are getting deployed, or, selectively for a subset of them.

Very similar to the existing deployment hooks, `beforeDeploy` is an asynchronous function that returns a promise and has access to a context object that provides dependencies that your function may or may not be interested in. Adding a `beforeDeploy` hook that runs before your Smart Contracts are being deployed is as simple as adding it to the `contracts` configuration like this:

```
// config/contract.js

module.exports = {
  ...
  contracts: {
    beforeDeploy: async () => {
      return Promise.resolve('yay');
    }
    ...
  }
};
```

As expected, for more control, `beforeDeploy` can be defined on a per Smart Contract basis like this:

```
// config/contract.js

module.exports = {
  ...
  contracts: {
    ...
    SimpleStorage: {
      beforeDeploy: async (context) => {
        // can use `context` if needed
        return Promise.resolve('yay');
      }
      ...
    }
  }
};
```
Learn more about Embark's [deployment hooks in the documentation](/docs/contracts_configuration.html#Deployment-hooks).

## Enabling and disabling services via the console
If you've used Embark before, you're probably aware that it comes with a very powerful dashboard with an integrated CLI. This CLI exposes a bunch of commands that can be used to interact with Embark's run-time. Some commands serve a very specific use case, such as `api start` and `api stop`. With Embark 4.1 we decided to generalize the commands that enable users to start and stop service processes started by Embark.

Therefore, the following commands are considered deprecated in favour of a new generalized command:

- `api start/stop`
- `webserver start/stop`

The new `service` command lets you start and stop `api`, `webserver`, `blockchain`, `ipfs`, `swarm`, `embark` and `api`:

```
$ service <service> on/off
```

This works within Embark's command line Dashboard, as well as [Cockpit's dashboard](https://embark.status.im/docs/cockpit_dashboard.html). To learn more about Embark's interactive console and its command, head over to the [documentation](/docs/using_the_console.html#Enabling-and-disabling-processes).

## Accounts access inside tests

In order to make writing tests in Embark a little bit more convenient, accounts configured and set up via the `config()` function are now injected into `describe()` blocks, making writing tests a little bit more predictable and easier to reason about.

Prior, in order to get hold of accounts within tests, the following was needed:

```
let accounts = [];

config({
  contracts: {
    ...
  }
}, (err, _accounts) => {
  accounts = _accounts;
});

contract('My contract', () => {

  it('does something', () => {
    // can use `accounts` here
  });
});
```

Notice that Embark won't run the `contract()` block until `config()` is done doing its work. Therefore, using a global variable was the recommended way to re-initialize `accounts` once `config()` runs its callback.

The same can now be achieved with the following code:

```
config({
  contracts: {
    ...
  }
});

contract('My contract', accounts => {

  it('does something', () => {
    // can use `accounts` here
  });
});
```
Instead of managing an `accounts` variable yourself, you can just ask for it now within `contract()`'s callback.

## Several improvements inside Cockpit

Cockpit has got a lot of new things as well. This includes [draggable tabs]() inside the code editor, pagination support for [Smart Contracts](https://github.com/embarklabs/embark/commit/d71352b) and the [accounts explorer](https://github.com/embarklabs/embark/commit/745edaf), alphabetically [sorted Smart Contracts](https://github.com/embarklabs/embark/commit/0e9a4a1), and the ability to [send ETH to payable Smart Contract methods](https://github.com/embarklabs/embark/pull/1649) via the Cockpit UI.


## What's next?

We've spent a lot of time fixing bugs and revisiting existing, user-facing APIs within Embark and aim to improve those as much as we can to make working with Embark as pleasant as possible. We've been also doing a lot of research and experimentation about integrating with other blockchain platforms, to get Embark ready for the future of decentralization to come.

That's why our next step is to work on v5, where we'll be focussing on making Embark's accounts configuration less confusing and more unified (no more multiple places to define accounts!), as well as a bunch of internal refactor.


Stay tuned with latest changes happening in Embark by [watching our GitHub repository](https://github.com/embarklabs/embark) and following us on [Twitter](https://twitter.com/EmbarkProject)!
