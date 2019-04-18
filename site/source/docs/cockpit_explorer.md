title: Cockpit Explorer
layout: docs
---

The Explorer view in Cockpit provides an easy and accessible way to browse your way through Smart Contracts, accounts, blocks and transactions. 

## Overview

In the overview of the Explorer we see a aggregation of available accounts, mind blocks and performed transactions. Each of these are paginated, making it easy to navigate through them:

![Cockpit Explorer Overview](/assets/images/cockpit_explorer_overview.png)

## Viewing Accounts

Account detail view can be accessed by clicking on an account address or hash. The account detail view then not only displays data about the account, but also all transactions associated with the account.

This makes it very convenient to find transactions, if we're aiming to find any that belong to a certain account.
![Cockpit Contract View](/assets/images/cockpit_explorer_account.gif)

## Viewing Blocks

Blocks can be inspected as well, just by clicking on their hash. This will open up a block detail view that contains all the data attached to the block in question, including transactions that ended up in there.

![Cockpit Explorer Block](/assets/images/cockpit_explorer_block.png)

## Viewing Transactions

It's no surprise that Cockpit's Explorer offers a view for inspecting transactions as well. Clicking on a transaction hash takes us to the detail view, rendering all relevant transaction data.

![Cockpit Contract View](/assets/images/cockpit_explorer_transactions.gif)

## Exploring Smart Contracts

We can extract a lot of information about our deploy Smart Contract instances in the Explorer. When entering a Smart Contract view, we can choose to open any of the available tabs:

- **Interact** - Call methods on your Smart Contract instance
- **Details** - View the ABI and byte code of your Smart Contract
- **Transactions** - List and explore all transactions and events associated with that Smart Contract instnace


![Cockpit Contract View](/assets/images/cockpit_explorer_contracts_detail.gif)

