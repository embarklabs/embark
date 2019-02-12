const path = require('path');
const fs = require('fs');

module.exports = (embark) => {
  embark.events.on('runcode:ready', () => {
    const pathPromise = new Promise((resolve, reject) => {
      embark.events.request("version:get:web3", (web3Version) => {
        if (web3Version === "1.0.0-beta") {
          return embark.events.request('embark:path', 'node_modules', (result) => {
            const web3Path = require.resolve("web3", {paths: [result]});
            resolve(web3Path);
          });
        }
        embark.events.request("version:getPackageLocation", "web3", web3Version, (err, location) => {
          if (err) {
            return reject(err);
          }
          embark.events.request('dapp:path', location, resolve);
        });
      });
    });

    pathPromise.then((web3Location) => {
      web3Location = web3Location.replace(/\\/g, '/');
      embark.events.emit('runcode:register', 'Web3', require(web3Location), false);

      let code = `\nconst Web3 = global.Web3 || require('${web3Location}');`;
      code += `\nglobal.Web3 = Web3;`;

      const connectorCode = fs.readFileSync(path.join(__dirname, 'web3Connector.js'), 'utf8');
      code += connectorCode;

      code += "\nEmbarkJS.Blockchain.registerProvider('web3', web3Connector);";

      code += "\nEmbarkJS.Blockchain.setProvider('web3', {});";

      embark.addCodeToEmbarkJS(code);

      code = "EmbarkJS.Blockchain.setProvider('web3', {});";

      const shouldInit = (_config) => {
        return true;
      };

      embark.addConsoleProviderInit('blockchain', code, shouldInit);
    });
  });
};
