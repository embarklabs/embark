title: Building with Embark
layout: docs
---

As discussed in [Running Apps](running_apps.html#Using-the-run-command), Embark takes care of quite a few things developing applications, including compiling Smart Contracts, JavaScript and other assets. In this guide we'll learn how to take full advantage of Embark's flexibility to build our Smart Contracts or even replace the entire build pipeline for our application's assets.

## Building your app

Embark's `build` command enables us to build our decentralized application and deploy it accordingly. Similar to `embark run`, it compiles our Smart Contracts, deploys them to a blockchain network that our app is connected to, processes our app's assets and uploads them to the configured decentralized storage (e.g. IPFS).

By default, `embark build` will use the `production` mode to build our application.

```
$ embark build
```

## Compiling Smart Contracts only

If we're building a [Smart Contract only application](http://localhost:4000/docs/create_project.html#Creating-%E2%80%9Ccontracts-only%E2%80%9D-apps), or we're simply not interested in building the entire application and deploying it, but just want to compile our Smart Contracts, we can use the `build` command's `--contracts` option:

```
$ embark build --contracts
```

