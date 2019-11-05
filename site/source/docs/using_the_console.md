title: Using the Interactive Console
layout: docs
---

Another powerful feature of Embark is its interactive console. It helps you debugging your application and lets you talk to your already deployed Smart Contracts. In this guide we'll take a closer look at how to work with it.

## Starting the console

Starting Embark's interactive console is just a matter of running

```
$ embark console
```

Very similar to `embark run`, Embark will compile and deploy your application, however, it won't spin up a webserver for your application. After that, you'll see a prompt sitting IDLE, waiting for you to enter commands.

```
Embark (development) > _
```

The console will surface the environment we're running Embark in at the moment. If we don't specify an environment, Embark will default to `development`, as discussed in our [guide on environments](/docs/environments.html).

From now on, we can keep entering commands and have them processed by Embark until we're done with whatever we're aiming to do.

Let's take a look at a few them!

## The `help` command

Probably one of the most important commands is the console's `help` command. This will give us some useful information about what we can and what we can not do inside the interactive console.

Enter the following command and see for yourself:

```
Embark (development) > help<ENTER>
```

This is a good time to read a bit through the available commands and familiarize yourself with them.

## Enabling and disabling process logs

By default, Embark will log output from all processes into the console. Since this can get quite verbose sometimes, we can disable logging for certain processes using the `log` command.

Simply specify the process and turn it `on` or `off`:

```
Embark (development) > log ipfs off
```

## Accessing Smart Contract instances

One thing that the console’s help doesn't tell us, is that each and every of our deployed Smart Contracts is available as descriptive JavaScript object. Simply enter the name of your Smart Contract and Embark will output its structure, properties and methods:

```
Embark (development) > SimpleStorage<ENTER>
```

This turns out to be very useful when inspecting available methods and properties on already deployed Smart Contracts. Notice that not only your own Smart Contract's are available within the interactive console, but also 3rd-party Smart Contracts that [have been configured](/docs/contracts_configuration.html#Referencing-already-deployed-Smart-Contracts) accordingly.

## Calling asynchronous APIs

The interactive console comes with its own JavaScript execution context, meaning we can actually run JavaScript code from inside the console.

This applies to synchronous as well as asynchronous APIs, which is very common when dealing with Smart Contract instances. There is different ways to use asynchronous APIs in JavaScript. Smart Contract instances tend to use `Promise`-based APIs, making them a great fit for JavaScript's `async/await` syntax.

`await` is an ES2015 keyword that is very useful when dealing with asynchronous APIs. It let's us wait for a Promise to resolve and simply returns the result.

In both the dashboard's console and the standalone console, you can use `await` for `Promise`-based calls:

```
Embark (development) > await SimpleStorage.methods.get().call()<ENTER>
```

This works with other objects as well. The following example outputs available accounts emitted by the `web3` object:

```
Embark (development) > await web3.eth.getAccounts()<ENTER>
```

## Installing plugins

We can also install Embark plugins using the interactive console. This can be done using the `plugin` command.

```
Embark (development) > plugin install embark-status
```

This will install and load the plugin, without the need to restart Embark.

## Retrieving authentication tokens for Cockpit

When using [Cockpit](/docs/cockpit_introduction.html), Embark's companion web interface, it's necessary to authenticate through the web browser with the Embark process we want Cockpit to connect to. Embark and Cockpit use an authentication token based system for that. All we have to do is entering a valid token in the authentication mask, or append it as a query parameter to Cockpit.

To get a valid token, use the `token` command, which will output the token and copy it to your clipboard:

```
Embark (development) > token<ENTER>
```

## Registering custom commands

It's possible to extend Embark's interactive console to include custom commands. Head over to our [Plugin guide](/docs/plugin_reference.html#registerConsoleCommand-options) which discusses this in more detail!

## Dashboard or interactive console?

In our section on [using the dashboard](/docs/dashboard.html) we've slightly mentioned that Embark's dashboard comes with a console as well and you might wonder, why there's a separate command to start an interactive console in standalone mode.

This is a very valid question, so here are a few scenarios where you might want to prefer running the interactive console over the dashboard:

- You want to copy & paste output from Embark (this doesn't work well within the dashboard)
- You already have an existing Embark instance running and want to connect to it using the interactive console

As the last point suggests, running `embark console` when Embark is already running on your machine, it'll connect to that existing process,
letting you interact with an already deployed application.

