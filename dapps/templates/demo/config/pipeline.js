// Embark has support for Flow enabled by default in its built-in webpack
// config: type annotations will automatically be stripped out of DApp sources
// without any additional configuration. Note that type checking is not
// performed during builds.

// To enable Flow type checking refer to the preconfigured template:
//   https://github.com/embark-framework/embark-flow-template
// A new DApp can be created from that template with:
//   embark new --template flow

module.exports = {
  typescript: false,
  // Setting `typescript: true` in this config will disable Flow support in
  // Embark's default webpack config and enable TypeScript support: .ts and
  // .tsx sources will automatically be transpiled into JavaScript without any
  // additional configuration. Note that type checking is not performed during
  // builds.

  // To enable TypeScript type checking refer to the preconfigured template:
  //   https://github.com/embark-framework/embark-typescript-template
  // A new DApp can be created from that template with:
  //   embark new --template typescript
  enabled: true 
  // Setting `enabled: false` in this config will disable Embark's built-in Webpack
  // pipeline. The developer will need to use a different frontend build tool, such as 
  // `create-react-app` or Angular CLI to build their dapp
};
