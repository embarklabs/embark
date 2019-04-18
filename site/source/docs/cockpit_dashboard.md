title: Cockpit Dashboard
layout: docs
---

The first view we're getting when entering Cockpit is its Dashboard view. Consider this your central station when developing, deploying and debugging your application. It has a lot of things to offer, so let's get right to it and take a look!

## Overview

![Cockpit Dashboard](/assets/images/cockpit_dashboard.png)

The dashboard is separated into different sections, which each of them having a certain responsibility. Here's a brief overview of what these are.

- **Navigation & Search** - At the very top we have the navigation and search. Those are self explanatory, but we'll talk a bit more about search features in a few moments.
- **Available Services** - Right below we see boxes for services monitoring. These boxes tell us what services are up and running and will respond accordingly when turned off.
- **Interactive Console** - This is the Cockpit equivalent of Embark's [Interactive Console](/docs/using_the_console.html).
- **Deployed Smart Contracts** - The current status of deployed Smart Contracts. Again, very similar to Embark's [Dashboard](/docs/dashboard.html).

## Navigation & Search

We can navigate through different sections and parts of Cockpit by using the links in the navigation bar as shown below. Notice that the active view is also visually reflected in the navigation as well.

![Cockpit Navigation](/assets/images/cockpit_navigation.gif)

Cockpit's search is very powerful and lets us easily search for transactions, Smart Contracts, blocks etc. from a single search bar. All we have to do is entering a valid hash, or, in case we're searching for a deployed Smart Contract, entering the name of the Smart Contract works too:

![Cockpit Search](/assets/images/cockpit_search.gif)

## Available Services

As mentioned above, the available services tell us which processes and services are running and available within our current Embark session. This is simply for monitoring purposes but can be very useful in case any of the processes is crashing or will be turned off. 

The components will reflect their active state in the UI. We can test this easily disabling any of the services using their dedicated configuration files.

## Interactive Console

This is an equivalent to Embark's [Interactive Console](/docs/using_the_console.html) just in a more rich and interactive fashion. We can use the same commands, however in addition we also get something called **Smart Suggestions**. 

When typing a command, Embark will provide decent suggestions, making it very easy to explore what command options are available!

![Cockpit Smart Suggestions](/assets/images/cockpit_suggestions.gif)

## Deployed Smart Contracts

As the name suggests, this sections lists all of our application's deployed Smart Contracts. Not only that, we can click on any of them and get a nice detail view of the Smart Contract within Cockpit's [Explorer](/docs/cockpit_explorer.html).

![Cockpit Dashboard Contracts](/assets/images/cockpit_dashboard_contracts.gif)

## Changing Dark and Light theme

Another thing that web-based user interfaces enable easily as opposed to others, is changing the appearance of an application. Cockpit implements two different themes to choose from - light and dark. The light theme is the default.

Toggling between light and dark theme is as easy as clicking on the cog wheel in the navigation bar and selecting the theme respectively:

![Cockpit change theme](/assets/images/cockpit_change_theme.gif)

