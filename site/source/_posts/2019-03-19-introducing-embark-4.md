title: Introducing Embark 4.0 - Cockpit, Debugger and more
summary: "Embark 4.0 is finally here! Check out what the greatest release yet has to offer!"
author: jonny_zerah
categories:
  - announcements
layout: blog-post
image: '/assets/images/EMBARK_HEADER_ALT_OPTIMIZED.jpg'
alias: news/2019/03/18/introducing-embark-4/
---

![Embark](/assets/images/EMBARK_HEADER_ALT_OPTIMIZED.jpg "Embark")

**Embark 4.0 is officially out of beta and ready for developers around the world. Cockpit (the new web UI dashboard), a robust debugger, and the frontend-agnostic build pipeline provide the support you need to develop production-ready decentralized applications.**

2019 is off to a great start! We’ve been taking Embark 4.0 from alpha to beta, and are now happy to present the official release of version 4.0. It comes jam-packed with many new features, including Cockpit, a transaction debugger, and a massively improved integration with existing frontend tooling. To mark this major milestone, we’ve also launched our new website with updated docs, more tutorials, and a brand new look!

Thanks to all the developers who have been using, testing, contributing to, and providing feedback on the beta version. The official release of 4.0 is now ready for the world to use. Read on for an overview of the key features or simply get going with our [Quick Start Guide](/docs/quick_start.html).

{% notification info 'Embark now follows SemVer' %}
Version 4.0 contains **some breaking changes**, however we kept them at a minimum and you can learn about all of them in our article on [upgrading DApps created with Embark 3.x](/news/2019/03/18/upgrading-to-embark-4/).

That said, with the release of 4.0 **Embark will now follow SemVer** making it easier for developers to update and watch out for changes.
{% endnotification %}

## Cockpit – An intuitive Web Interface
Cockpit has been under active development for a few months and is officially ready! Cockpit is your command center for building, debugging, and deploying decentralized applications.

**The dashboard** is the first page users see when they load Cockpit. It provides an overview of all processes controlled by Embark and comes with an interactive console and predictive commands, allowing developers to conveniently interact with Embark and all components (e.g. Ethereum blockchain, ENS, Whisper, IPFS/Swarm, etc). The dashboard also  displays a summary of deployed contracts and enables users to search for accounts, blocks, addresses, and transactions.

For more information regarding Cockpit’s dashboard, please refer to the [Embark docs](/docs/cockpit_dashboard.html).


![Cockpit Dashboard](/assets/images/cockpit_dashboard_release.png "Cockpit Dashboard")

**The blockchain explorer** provides detailed views of blocks, transactions, smart contracts, and connected accounts. We’ve also introduced a brand new way to analyze deployed instances of smart contracts. Within the contracts view, users can interact with a contract’s API, view the ABI and bytecode, retrieve the contract’s transaction logs, and invoke Cockpit’s new integrated debugger. [Learn more](/docs/cockpit_explorer.html)


![Cockpit Explorer](/assets/images/cockpit_explorer_overview.png "Cockpit Explorer")

**Iterative Deployment** enables selective deployment of smart contracts to any network, removing headaches when it comes to complex applications. Using the deployment panel, single or multiple smart contracts can be deployed to production safely, with full control over the process. [Learn more](/docs/cockpit_deployment.html)

**The code editor** allows you to edit a DApp’s source files from within Cockpit for quick and easy updates. The web-based editor enables a DApp’s source code to be changed on the fly. Like any typical code editor, it has a file tree, can open multiple source files, and allows files to be added and deleted. Users can also access and interact with contact properties and methods in the editor’s UI. Contracts even get redeployed as changes are saved – iterative development at its best! [Learn more](/docs/cockpit_editor.html)

![Cockpit Editor](/assets/images/cockpit_editor_release.png "Cockpit Editor")

## Integrated Debugger
Debugging is an important part of all software development and has been a significant challenge for blockchain developers for some time. The new Embark debugger provides an easy way to debug contracts by displaying solidity source codes lines where a transaction failed. This greatly speeds up development and helps to eliminate bugs.

The debugger comes in handy in a number of situations. For example, if a transaction fails, no problem! The debugger will spring into action and offer a quick shortcut to help identify the problem and start troubleshooting.

## Better tooling integration
Embark is now compatible with any frontend tooling such as Create React App and the CLI tools for Angular, Vue, and more.

Previously, Embark used its own pipeline, which was compatible with most frontend frameworks by way of Webpack configuration. However, it wasn’t compatible with most frontend tooling. Embark 4 is now fully frontend-agnostic, but the old pipeline is still available if you wish to use it.

## Additional Updates and Features
We’ve introduced a number of updates and new features to go along with the key features mentioned above. These include:

- **New contract deployment hooks**: onDeploy and afterDeploy allow for complete customization of the deployment lifecycle.
- **Better account configuration**: accounts are now consistently defined in config/blockchain.js.
- **Embark can be installed as a local dependency for per-project versioning**: global installation of Embark is no longer required.

## A new Website and Fresh New Look

![Website Release](/assets/images/website_release.png "Website Release")

Embarking into decentralized applications is exciting and fun. That’s precisely why we updated our website: to better accompany developers on their journey. Not only did we give Embark a facelift with slick new illustrations and a fresh logo, but we also made it easier to navigate developer resources such as docs, plugins, and tutorials. For developers new to Embark, the  Quick Start guide will get you up and running in no time!

## Get Started Now
Embark 4.0 is a great companion for those embarking into the ether! From brand new developers still learning the concepts, to seasoned pros with a specific project in mind, Embark is the ideal all-in-one development platform for building and deploying decentralized applications. Whether developing DApps end-to-end or simply deploying smart contracts, Embark allows developers to pick and choose which features, plugins, and tools to integrate.

Check out the [Quick Start guide](/docs/quick_start.html) or dive right into the [documentation](/docs).

Chat with us in [Gitter](https://gitter.im/embark-framework/Lobby)
Star the repo on [GitHub](https://github.com/embarklabs/embark)
Follow us on [Twitter](https://twitter.com/EmbarkProject)
