title: Executing Scripts
layout: docs
---

There are various features in Embark that help you making the deployment of your DApps and Smart Contracts as smooth as possible. Next to general [Smart Contract Configurations](contracts_configuration.html), [Deployment Hooks](contracts_configuration.html#Deployment-hooks) and [Cockpit](cockpit_introduction.html), there's the possibility to run (migration) scripts as well.

In this guide we'll explore why scripts are useful and how they can be run.

## Why scripts?

Given that Embark supports [afterDeploy](contracts_configuration.html#afterDeploy-hook) hooks that make it extremely easy to perform custom operations after all of your Smart Contracts have been deployed, you might wonder when and where scripts can be useful.

It's important to note that `afterDeploy` hooks are executed every time all Smart Contracts have been deployed. Often there are cases where running a (migration) script manually is what you really need.

Scripts let you do exactly that as they can be run at any time, regardless of what your app's current deployment status is.

## What's a script?

A script is really just a file with an exported function that has special dependencies injected into it. Here's what it could look like:

```
modules.exports = async ({ contracts, web3, logger}) => {
  ...
};
```

The injected parameters are:

- `contracts` - A map object containing all of your Smart Contracts as Embark Smart Contract instances.
- `web3` - A web3 instances to give you access to things like accounts.
- `logger` - Embark's custom logger.

Scripts can be located anywhere on your machine, but should most likely live inside your project's file tree in a dedicated folder.

## Running scripts

To run a script, use the CLI `exec` command and specify an environment as well as the script to be executed:

```
$ embark exec development scripts/001.js
```

The command above will execute the function in `scripts/001.js` and ensures that Smart Contracts are deployed in the `development` environment.

If you have multiple scripts that should run in order, it's also possible to specify the directory in which they live in:

```
$ embark exec development scripts
```

Embark will then find all script files inside the specified directory (in this case `scripts`) and then run them one by one. If any of the scripts fails by emitting an error, Embark will abort the execution. Scripts are executed in sequence, which means all following scripts won't be executed in case of an error.

## Error Handling

It's possible and recommended for scripts to emit proper errors in case they fail to do their job. There are several ways to emit an error depending on how you write your function. Scripts are executed asyncronously, so one way to emit an error is to reject a promise:

```
modules.exports = () => {
  return new Promise((resolve, reject) => {
    reject(new Error('Whoops, something went wrong'));
  });
};

// or
modules.exports = () => {
  return Promise.reject(new Error ('Whoops, something went wrong'));
};
```

If your script uses the `async/await` syntax, errors are emitted by default when using other `async` APIs that fail:

```
module.exports = async () => {
  await someAPIThatFails(); // this will emit an error
};
```

If an error is emitted, Embark will do its best to give you information about the original error:

```
  001.js running....
Script '001.js' failed to execute. Original error: Error: Whoops, something went wrong
```

## Tracking scripts

Just like Smart Contract deployments are tracked, (migration) scripts can be tracked as well. Since scripts can be one-off operations, Embark will not track whether they have been executed by default. Users are always able to run a script using the `exec` command as discussed in the previous sections.

To have Embark "remember" that a certain script was already run, you can use the `--track` option of the `exec` command, which will force tracking for this particular script:

```
$ embark exec development scripts/001.js --track
```

If we try to run the script again with the `--track` option, Embark will notice that the script has already been executed and tell us that it's "already done".

```
$ embark exec development scripts/001.js --track
.. 001.js already done
```

If however, we don't provide the `--track` flag, Embark will execute the script as usual.

For cases in which we **do** want to track a set of scripts, especially when the main use case are migration operations, we can put our scripts in a special "migrations" directory. All scripts inside that directory will be tracked by default.

The directory can be specified using the `migrations` property in your project's embark.json:

```
{
  ...
  migrations: 'migrations'
}
```

If no such property is specified, Embark will default to "migrations". Running any script or set of scripts is then automatically tracked.
