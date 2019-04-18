title: Creating apps with Embark
layout: docs
---

Once Embark is installed, there are different ways to create a new decentralized application. Whether we intent to create an application that uses only Smart Contracts, or we want to take advantage of other decentralized features like storages and messaging, Embark provides options and templates for various scenarios. Let's take a look!

## Using the `demo` command

As discussed in our [quickstart guide](/docs/quick_start.html), the fastest way to get up and running with Embark is using its `demo` command. This will scaffold a new demo application and its needed environment in a folder called `embark_demo`. The demo application lets you play with Embark's APIs through a pre-built web interface.

```
$ embark demo
```

## Creating a new app

If you prefer starting entirely from scratch, while still getting a ready to use environment, Embark's `new` command has got you covered. Similar to the `demo` command, it will scaffold a new project folder. However, it will not include the demo application. The green field is all yours.

{% notification info 'Quick tip: Smart Contract only apps' %}
Smart Contract developers that mainly want to focus on building and deploying Smart Contracts can take advantage of `new` command's `--contracts-only` option, as described [here](create_project.html#Creating-“contracts-only”-apps).
{% endnotification %}

```
$ embark new <YourDappName>
```

## Creating apps from templates

Another possible scenario to start from is taking advantage of a template. Embark [comes with templates](/templates) for various environments and frameworks, but you can also use any template created by the community. In order to create a new app from a template, use the `--template` option and either specify a supported template name, or a Git host URL.

The following example creates a new application from [Embark's TypeScript template](https://github.com/embark-framework/embark-typescript-template):

```
$ embark new <YourDAppName> --template typescript
```

To learn more about supported templates, head over to our [templates](/templates) or look out for `embark-[template_name]-template` [repositories](https://github.com/embark-framework?utf8=%E2%9C%93&q=template&type=&language=).

Templates can also be fetched from external resources as long as they can be referred to via Git host URLs. The following example fetches a template from a GitHub repository and uses that to create that app:

```
$ embark new <YourDAppName> --template https://github.com/embark-framework/embark-vue-template
```

In fact, in case of GitHub, the same can be done with the username/repository shortcut:

```
$ embark new <YourDAppName> --template embark-framework/embark-vue-template
```

It is even possible to specify the branch by appending a `#` and the branch name you're interested in:

```
$ embark new <YourDAppName> --template status-im/dappcon-workshop-dapp#start-here
```

## Creating "contracts-only" apps

Sometimes, all we really want to do is creating, developing, compiling and deploying Smart Contracts without introducing an actual front-end that talks to them. Embark lets us scaffold apps that come with the most minimal setup needed to build and deploy our Smart Contracts, using the `--contracts-only` option.

The following command will create a project with all Embark services disabled except the blockchain service.

```
$ embark new <YourDAppName> --contracts-only
```

This will also affect the generated application structure, as Smart Contract only apps are less complex. Learn more about the application structure of Smart Contract only apps [here](structure.html#Simple-template-structure).

{% notification info 'A note on --simple' %}
In earlier versions of Embark the same could be achieved using the `--simple` option. This option is still supported but will be deprecated and likely be removed in future versions of Embark.
{% endnotification %}
