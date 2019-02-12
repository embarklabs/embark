const path = require('path');
const fs = require('fs');

function whenRuncodeReady(embark) {
  return new Promise((resolve) => {
    embark.events.on('runcode:ready', () => {
      resolve();
    });
  });
}

function getWeb3Location(embark) {
  return new Promise((resolve, reject) => {
    embark.events.request("version:get:web3", (web3Version) => {
      if (web3Version === "1.0.0-beta") {
        const nodePath = embark.embarkPath('node_modules');
        const web3Path = require.resolve("web3", {paths: [nodePath]});
        return resolve(web3Path);
      }
      embark.events.request("version:getPackageLocation", "web3", web3Version, (err, location) => {
        if (err) {
          return reject(err);
        }
        const locationPath = embark.embarkPath(location);
        resolve(locationPath);
      });
    });
  });
}

module.exports = async (embark) => {
  await whenRuncodeReady(embark);

  const web3LocationPromise = getWeb3Location(embark);

  embark.events.setCommandHandler('blockchain:connector:ready', (cb) => {
    web3LocationPromise.then((_web3Location) => {
      cb();
    });
  });

  let web3Location = await web3LocationPromise;

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
};
