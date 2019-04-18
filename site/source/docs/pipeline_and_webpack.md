title: Building & Asset Pipeline
layout: docs
---

As discussed in [Running Apps](running_apps.html#Using-the-run-command), Embark takes care of quite a few things developing applications, including compiling Smart Contracts, JavaScript and other assets. In this guide we'll learn how to take full advantage of Embark's flexibility to build our Smart Contracts or even replace the entire build pipeline for our application's assets.

## Building your app

Embark's `build` command enables us to build our decentralized application and deploy it accordingly. Similar to `embark run`, it compiles our Smart Contracts, deploys them to a blockchain network that our app is connected to, processes our app's assets and uploads them to the configured decentralized storage (e.g. IPFS).

By default, `embark build` will use the `production` mode to build our application.

```
$ embark build
```
### Specifying a mode using `--pipeline`


Embark comes with two modes for building our application:

* **development** - This mode is for development purposes and produces sourcemaps as well as unoptimized client-side code. Whenever we use `embark run` or `embark console`, this mode is used by default. Since this mode skips code optimizations, it's also the faster mode.
* **production** - Unsurprisingly, this mode is used to create production artifacts of our application. It produces optimized code and therefore, takes longer to build. However, client-side code will be highly optimized, thus smaller in file size. This mode is the default for `embark build` and `embark upload` commands.

We can specify a mode using the `--pipeline` option. This is available for both, `embark run` and `embark build` commands:

```
$ embark build --pipeline development
```

## Compiling Smart Contracts only

If we're building a [Smart Contract only application](http://localhost:4000/docs/create_project.html#Creating-%E2%80%9Ccontracts-only%E2%80%9D-apps), or we're simply not interested in building the entire application and deploying it, but just want to compile our Smart Contracts, we can use the `build` command's `--contracts` option:

```
$ embark build --contracts
```

## Understanding the build pipeline

Embark uses [webpack](https://webpack.js.org/) to bundle and postprocess all kinds of assets of our decentralized application. This also includes things like:

* ES2015+ syntax using Babel
* Importing of CSS, SCSS, PNG, SVG & Fonts in JavaScript
* Support for React & JSX
* Automatic support for older browsers via Babel's preset-env (by default, Embark uses a browser list setting of `['last 1 version', 'not dead', '> 0.2%']`
* Sourcemaps generation (when in development mode)
* Minification and tree shaking (when in production mode)

{% notification danger 'Deprecation warning:' %}
Since Embark version 4.0.0 it's possible (and recommended) to use Embark in combination with other front-end tooling, such as Angular CLI, Vue CLI or Create React App, making Embark's own build pipeline obsolete.

When using Embark with any other existing front-end tooling, please turn off Embark's internal build pipeline by setting the following configuration option in `config/pipeline.js`:

<pre class="highlight">
enabled: false
</pre>
{% endnotification %}



### Customizing the build process

Sometimes we run into scenarios where our setup is so specific that the build process for our application needs further customization. For those cases, where Embark's built-in build pipeline isn't enough, it enables us to "eject" the internally used `webpack.config.js` file, so we can change it to our needs and fully bypass Embark's internal build process.

Ejecting the internally used config file is as simple as using Embark's `eject-build-config` command like this:

```
$ embark eject-build-config
```

{% notification info 'On --eject-webpack option' %}
In older versions of Embark, the same could be achieved using the `--eject-webpack` option. This option still works, but is now considered deprecated and will be removed in future versions of Embark.
{% endnotification %}

{% notification danger 'Deprecation warning:' %}
As mentioned earlier in this guide, we recommend using existing front-end tooling for building and optimizing your application's front-end code. This command will be deprecated in future versions of Embark.
{% endnotification %}

