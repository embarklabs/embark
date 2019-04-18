title: How to upgrade to Embark 4
summary: "In this guide, we'll learn how to upgrade a Dapp created with Embark 3.x to Embark 4"
author: jonathan_rainville
categories:
  - tutorials
layout: blog-post
---

The release of Embark 4.0 is close at hand and the release candidate, `beta.1`, will introduce some breaking changes. Let's see what it takes to update an Embark 3.x Dapp to Embark 4.

## Use **any** frontend build tool!

That's right! The use of Embark's builtin pipeline in no longer required.

Historically, Embark 3.x came with a special Webpack pipeline because it automated development tasks, such as enabling the use of "magic" imports (ie `import SimpleStorage from "Embark/contracts/SimpleStorage";` or `import EmbarkJS from Embark/EmbarkJS`), and establishing a Web3 connection for the Dapp.

However, we discovered the hard way that those advantages were not worth the hit in development efficiency, compared to using an optimized pipeline, such as `create-react-app` or Angular CLI. Indeed, on every save, Embark would regenerate a lot of the Dapp-side code and then webpack the entire Dapp, often taking quite some time.

Therefore, we are announcing that Embark 4 can use **any** frontend development build tooling, letting Embark handle the things that it does best. This means we can use tools such as `create-react-app` or Angular CLI, or pretty much any other tool of your choice, alongside Embark. The Embark 3.x pipeline is still available for use for quick start applications if needed.

To migrate an existing Embark 3.x Dapp over to use Embark 4 with a third party pipeline, there are few small changes to your Dapp that are needed.

{% notification info 'NOTE' %}
If you are not interested in using a third party pipeline, you can skip to the next section to [see the rest of the breaking changes needed to migrate a Dapp to Embark 4](#New-Web3-plugin).
{% endnotification %}

### Converting to another pipeline

Converting to a third party pipeline is easy. This can be done with three simple improvements that Embark 4 has made available for us.

#### Artifact generation directory

NOTE: If you are planning on using Embark's built-in Webpack pipeline (and not use a third party pipeline), please [skip down to the remainder of the Embark 4 breaking changes](#New-Web3-plugin).

Embark 4 generates [Smart Contract artifacts](/docs/javascript_usage.html#Embark-Artifacts) for all of the Smart Contract in your Dapp. These artifacts enable importing the Dapp's Smart Contracts into the Dapp's source code. Most of these artifacts were already generated before, but lived inside the `.embark/` folder. Since most modern frontend build systems require source files to live inside of a very specific source folder, we have given developers the opportunity to specify the destination folder for these artifacts, allowing the frontend build tool to pick them up for processing.

The first thing we need to do is add a new `generationDir` property in the root of `embark.json`. This property tells Embark where to place the generated artifacts in the Dapp's filesystem. For example, `create-react-app` (CRA) has `src/` as source folder and the artifacts must be placed in that folder, so we would add in `embark.json`:

```json
{
  "generationDir": "src/embarkArtifacts"
}
```

#### "Magic" imports
Afterwards, we need to convert all "magic" imports in our Dapp's code to relative imports.

The first one is the EmbarkJS import. The "magic" import is `"Embark/EmbarkJS"`. Anywhere we have `"Embark/EmbarkJS"` in our Dapp's code, we need to convert that to the relative path. Because we are trying to get the `EmbarkJS` library, and the `embarkjs.js` script is located in the root of  `embarkArtifacts/`, we need to replace

```javascript
import EmbarkJS from "Embark/EmbarkJS"
```
with
```javascript
import EmbarkJS from "./embarkArtifacts/embarkjs"
```
{% notification info 'NOTE' %}
NOTE: The relative path is dependent upon the generationDir setting specified in embark.json [see the "Artifact generation directory" section above](#Artifact-generation-directory).
{% endnotification %}

Secondly, we need to update the "magic" Smart Contract imports. These will need to change from

```javascript
import ContractName from "Embark/contract/ContractName";
```
to
```javascript
import ContractName from "./embarkArtifacts/contracts/ContractName";
```

Thirdly, there used to be `import web3 from "Embark/web3"`, but it has been removed in Embark 4 in favor of using a global Web3 object. Don't worry, Embark is not removing web3 support, far from it. We actually just got rid of an import that did not provide a lot of benefit. In Embark 4, the global `web3` object is now available everywhere in the Dapp.

Now, all the Embark files and configs from your Dapp can be moved in to a project created by the frontend build tool of your choice.

### New project with another pipeline

Starting a new Dapp from scratch is easy, we have two options.

#### Embark's create-react-dapp template

The easiest option is to use our [new Embark CRA template](https://github.com/embark-framework/embark-create-react-dapp-template). It sets up a simple Embark project with all of the familiar files present in an Embark 3.x Dapp, with one minor difference: the config files are located in an `embarkConfig/` folder in the root of the Dapp to make sure they don't clash with CRA's config folder/files.

To get started with Embark's CRA template,

```
embark new --template embark-react-dapp my-dapp
cd my-dapp
embark run
```

Then, in another terminal,

```
cd my-dapp
yarn start // or alternatively, npm run start
```

That's it!

#### For other build tools

If we want to use another build tool than CRA, here are the steps:

Create a project using a frontend build tool like Angular CLI. Then, in another directory, execute `embark new your_projects_name`.

Afterwards, we copy all the files and folders from the Embark project to the build tool's folder. The only tweak that you will need to do is go in `config/pipeline.js` and set `enabled: false`, so that Embark's pipeline is disabled.

We can also go in `embark.json` and remove the `app` section (as well as Embark's source dir that you will not be using).

Lastly, check out [the "Artifact generation directory" section above](#Artifact-generation-directory) to make sure your artifacts directory is set up correctly for you build tool.

There you go, your project is ready.

We know that these steps are a bit too much, so we are working on a new command that lets you initialize an Embark project from inside a build tool's directory. Keep an eye out for that.

## New Web3 plugin

Starting with Embark 4 beta.1, Embark no longer supplies the Dapp with `Web3.js` by default. Don't run. We did that so that we can now have the possibility of supporting more than just `Web3.js`, such as EthersJS, and more. You can even roll your own.

To continue using `Web3.js` inside the Embark 4 Dapp, execute the following command in the Embark console: `plugin install embarkjs-connector-web3`.

This simply [installs `embarkjs-connector-web3` as a plugin](https://embark.status.im/docs/installing_plugins.html). Alternatively, this plugin can be installed manually by executing:
1. `yarn add embarkjs-connector-web3` or `npm install --save embarkjs-connector-web3`
2. Adding `"embarkjs-connector-web3": {}` to the `plugins` section of `embark.json`

It's as simple as that. This plugin will add the necessary commands and code for the Dapp to connect to the blockchain and register the necessary providers. The only prerequisite is for the Dapp to import `EmbarkJS` at least once. If using a third party pipeline, the `EmbarkJS` file can be imported using `import EmbarkJS from "./embarkArtifacts/embarkjs.js"` (or as specified by the `generationDir` in `embark.json`). If using Embark's built-in pipeline, `EmbarkJS` can be imported using `import EmbarkJS from "Embark/EmbarkJS";`.

## New Blockchain account configs

Embark 4 adds some new blockchain account configurations. To try to keep things as simple as possible, these additions are really similar to the ones in the contract configuration. For more information, please read the [Accounts Blockchain configuration guide](https://embark.status.im/docs/blockchain_accounts_configuration.html) in our docs.

However, we did introduce some small breaking changes. We removed:
- `account`: This is completely replaced by the new `accounts` property (notice the `s` at the end of `accounts`). It gives the developer more flexibility. To have exactly the same behavior as before, just use the `nodeAccounts` account type as [described in the docs](https://embark.status.im/docs/blockchain_accounts_configuration.md#parameter-descriptions)
- `simulatorMnemonic`: Removed in favor of Ganache's default mnemonic. If this functionality is still needed, please specify the desired mnemonic in the [blockchain config's `mnemonic` account type](https://embark.status.im/docs/blockchain_accounts_configuration.md#parameter-descriptions).

## Conclusion

This is a small taste of the features added to Embark 4, namely the ability to use a frontend build tool of choice. However, Embark 4 is jam-packed with additional new features, which we'll detail during the Embark 4 release.

In the meantime, all the Embark 4 goodness doesn't come at too high a price in terms of breaking changes.

Upgrading to Embark 4 will be a blast. If you ever have an issue, make sure to hit us up on [Gitter](https://gitter.im/embark-framework/Lobby).
