title: Introduction to Cockpit
layout: docs
---

Probably one of Embark's most exciting features is its companion web interface Cockpit. With Cockpit, we're aiming for offering an alternative and more powerful interface to make developing and debugging decentralized applications even easier.

Throughout the following sections we'll take a closer look at Cockpit's features and how we can use it to improve our developer experience when working with Embark!

{% notification info 'A note on Cockpit availability' %}
Please note that Cockpit is a feature that ships since Embark version 4.0 and is not available in or for previous versions of Embark.
{% endnotification %}

## What is Cockpit?

Cockpit is a web application that ships with Embark since version 4.0. It's an alternative and sometimes more powerful interface in comparison to [Embark's dashboard](/docs/dashboard.html), that connects to any existing Embark process. Since it's web-based, Cockpit offers a much richer and more interactive user interface, with additional tools and features that can't be found in Embark otherwise.

Some of Cockpit's features are:

- **Dashboard** - A highly interactive real-time dashboard with service monitoring and deployment status
- **Selective Deployment** - A deployment interface that gives you fine-grain control over when and how your Smart Contracts are deployed
- **Explorer** - A built-in blockchain explorer making it easy to explore blocks, transactions and accounts
- **Code Editor** - A web-based code editor, enabling changing your application's source on the fly
- **Utilities** - Powerful utility tools, including ENS, a transaction decoder and more

Cockpit is actively developed and implements new features on a regular basis.

## Starting Cockpit

Cockpit can be used as soon as Embark has been spinned up in any of our applications. As mentioned in our guide on [running apps](/docs/running_apps.html), Embark will start Cockpit as part of the run process. In fact, Embark even outputs a message, telling us how to open Cockpit:

```
Access the web backend with the following url: http://localhost:55555?token=xxxxx-xxxxx-xxxxx-xxxxx
```

Notice that `token` is a security measurement so nobody else can access your Embark processes through Cockpit (unless they have the token). To make it a little more secure, tokens are one-time use only. If we're trying to access the same session through different browser instances, one instance won't be able to connect.

We can always generate a new token inside [Embark's interactive console](/docs/using_the_console.html) using the [`token` command](/docs/using_the_console.html#Retrieving-authentication-tokens-for-Cockpit).

## Entering the Cockpit

Once Embark is running, entering the Cockpit is really just a matter of opening the URL shown by Embark. Let's explore what Cockpit has to offer in the following guides.

Bon Voyage! 
