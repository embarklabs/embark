title: Installing Plugins
layout: docs
---
Embark offers a variety of [plugins](/plugins) you can choose from  and you can even [build your own](/docs/creating_plugins.html) to make Embark work with your tool of choice. Let's take a look at how to install and configure plugins for Embark.

## Finding the right plugin

Before we can install a plugin we need to know which one we want to install first. Finding the right plugin shouldn't be too hard. Supported Embark plugins are listed on the [Plugins](/plugins) page. Sometimes it's also helpful to search for repositories on GitHub that have an `embark-` prefix.

## Downloading plugins

Once we know what plugin we're interested in, it's really just a matter of adding them to our existing project. This can be done either by downloading and installing them via a package manager such as npm, or even through simple cloning using Git.

The following command installs a plugin for the `solc` compiler:

```
$ npm install embark-solc --save
```

This will also update our projects `package.json` as we're adding the plugin as a project dependency.

## Configuring plugins

After installation, we can configure the plugin. What configuration options exist depends entirely on the plugin but the way how configuration works is always the same.

To configure a plugin, add a dedicated section to your project's `embark.json` file:

```
...
"plugins": {
  "embark-solc": {}
}
...
```

Once that is done, check out the available configuration options for your plugin of choice. The `embark-solc` plugin allows for configuring whether the plugin should generate binary output or not using the `outputBinary` option. 

The following code sets activates this feature:

```
...
"plugins": {
  "embark-solc": {
    "outputBinary": true
  }
}
...
```

