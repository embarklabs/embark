title: Quick Start
tagline: 'Build your first DApp with Embark'
---

# Welcome to the Quick Start!

In this guide we'll explore how easy it is to quickly get up and running with Embark to build our first decentralized application. This is the perfect place to start if you haven't used Embark before.

Together, we're going to:

{% checklist 'Install Embark' 'Create an app' 'Run and deploy the app' %}

Hopefully, after that you'll be motivated to explore the rest of Embark's [documentation](/docs/overview.html). If you run into any problems along your journey, check out [our Gitter channel](https://gitter.im/embark-framework/Lobby) as well. We are there to help.

Let's get started!

## Installing Embark

First things first, we'll have to install Embark on our local machines. This is easily done buy using a package manager of your choice. The following command installs the Embark CLI as a global command using npm:

```
$ npm install -g embark
```

Once that is done, `embark` should be available as a global command.

{% notification info 'Prerequisites' %}
In order to actually start a blockchain client or other processes, there are some
more tools that need to be installed. Head over to our [installation guide](/docs/installation.html) to learn more.
{% endnotification %}

## Creating your first app

In order to get results as quickly as possible, Embark comes with a `demo` command that scaffolds and sets up a complete application for us to play with. Open up a terminal of your choice and run:

```
$ embark demo
$ cd embark_demo
```

This will create a demo application. Feel free to look around to get familiar with the project's structure, but don't worry. We'll take a closer look at it later in one of our [dedicated guides](structure.html).

## Running your app

The fastest way to get your app running is to use Embark's `run` command. It takes care of a lot of things, such as spinning up an Ethereum and IPFS node, or keeping an eye on file changes to recompile your code. There's other ways to [run your app](running_apps.html), in case you need more control over different processes, but let's not get ahead of ourselves.

```
$ embark run
```

Once executed, we'll notice that Embark opens up a dashboard view inside our terminal. This is the place where we monitor running processes such as compilation of our sources as well as deployments. As everything in Embark, the dashboard usage is configurable. If we prefer Embark to just output logs of whatever it's doing, this can be easily done by running the same command with the `--nodashboard` option.

Notice that the dashboard comes with sections for **Contracts**, **Environment**, **Status**, **Available Services**, **Logs** and **Console**. While most of them are self explanatory, we'll take a closer look at those in the [dashboard guide](dashboard.html).

![Dashboard](/assets/images/embark-dashboard.png)

For now, let's focus on what has happened in the meantime. Embark has compiled and deployed the Smart Contracts that come with the demo application to a custom blockchain on your local machine. It has also compiled the web app that's part of the demo and deployed that to a local web server, which is listening on `http://localhost:8000`. In fact, Embark has probably already opened a browser window for you. 

If not, give it a try yourself and open [localhost:8000](http://localhost:8000) in your browser of choice!

## Getting help

**Congratulations!** You've just created your first decentralized application. Now it's a good time to explore what else Embark has to offer. To get started, type `help` into the running console to get a list of commands you can run inside the dashboard.

Also, make sure to check out the other guides and let us know if you miss anything! If you run into any problems, the [guide on troubleshooting](troubleshooting.html) is here to help.

<div class="o-container o-distance-l o-center">
  <a href="/docs/overview.html" class="c-button" title="Take me to the docs">Take me to the docs &rarr;</a>
</div>
