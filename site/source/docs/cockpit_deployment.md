title: Deploying with Cockpit
layout: docs
---

Cockpit offers an additional deployment experience that enables developers to deploy their application's Smart Contracts in an **iterative** and **selective** fashion. In this guide we'll take a closer look at how this works.

## Viewing Smart Contracts

When entering the deployment view, the first thing we see is the status of all our application's deployed contracts, similar to [Embark's dashboard](/docs/dashboard.html).

Next to their addresses, we see the arguments that have been used to initialized each and every Smart Contract. 

Clicking on any of the Smart Contracts opens up a detail view through which we even can call methods associated to that Smart Contract.

![Cockpit Contract View](/assets/images/cockpit_contracts_view.gif)

## Selective deployment

With the deployment view, it's possible to selectively deploy any of our application's Smart Contracts. By default, Embark will take care of deploying our Smart Contracts based on configurations discussed in our guide on [managing accounts](/docs/blockchain_accounts_configuration.html).

However, we can use an injected Web3 instance, for example provided by extensions like Metamask, and select individual Smart Contracts for deployment.

To make this work, we need to have Metamask setup, and activate the "Injected Web3" switch as shown below. Once activated, we can specify values used for initializing our Smart Contracts, as well as performing a gas estimation: 

![Cockpit Selective Deployment](/assets/images/cockpit_selective_deployment.gif)
