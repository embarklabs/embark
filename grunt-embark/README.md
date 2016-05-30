# grunt-embark
grunt plugin for [Embark](https://github.com/iurimatias/embark-framework) - DApp Framework for Ethereum

## Getting Started
From the same directory as your project's Gruntfile and package.json, install
this plugin with the following command:

```bash
$ npm install embark-framework --save-dev
$ npm install grunt-embark --save-dev
```

Once that's done, add this line to your project's Gruntfile:

```js
grunt.loadNpmTasks('grunt-embark');
```

## Config
Inside your `Gruntfile.js` file, add a section named `deploy`, containing
the fields `contracts` and `dest`.

### Here's an example that deploys contracts and generates the js client file

```js
deploy: {
  contracts: ["app/contracts/**/*.sol"],
  dest: "embark_client.js"
}
```
