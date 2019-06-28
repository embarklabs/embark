const async = require('async');
const shelljs = require('shelljs');
const fs = require('fs');
const path = require('path');

function compileSolcContract(logger, compileSettings, allowedDirectories, callback) {
  const command = `solc --standard-json --allow-paths ${allowedDirectories.join(',')}`;

  shelljs.ShellString(JSON.stringify(compileSettings)).exec(command, {silent: true}, (code, stdout, stderr) => {
    if (stderr) {
      logger.warn(stderr);
    }

    if (code !== 0) {
      return callback(`solc exited with error code ${code}`);
    }

    if (!stdout) {
      return callback('solc execution returned nothing');
    }

    callback(null, stdout.replace(/\n/g, ''));
  });
}

function getSolcVersion(logger, callback) {
  shelljs.exec('solc --version', {silent: true}, (code, stdout, stderr) => {
    if (stderr) {
      logger.warn(stderr);
    }

    if (code !== 0) {
      return callback(`solc exited with error code ${code}`);
    }

    if (!stdout) {
      return callback('solc execution returned nothing');
    }

    const result = stdout.match(/(\d+.\d+.\d+)/);
    callback(null, result[1]);
  });
}

function compileSolc(embark, contractFiles, contractDirectories, options, callback) {
  if (!contractFiles || !contractFiles.length) {
    return callback();
  }

  const logger = embark.logger;
  const outputBinary = embark.pluginConfig.outputBinary;
  const outputDir = embark.config.buildDir + embark.config.contractDirectories[0];
  const solcConfig = embark.config.embarkConfig.options.solc;

  let allowedDirectories = [];
  const remappings = [];
  const compilationSettings = {
    language: 'Solidity',
    sources: {},
    settings: {
      optimizer: {
        enabled: solcConfig['optimize'],
        runs: solcConfig['optimize-runs']
      },
      remappings,
      outputSelection: {
        '*': {
          '': ['ast'],
          '*': [
            'abi',
            'devdoc',
            'evm.bytecode',
            'evm.deployedBytecode',
            'evm.gasEstimates',
            'evm.legacyAssembly',
            'evm.methodIdentifiers',
            'metadata',
            'userdoc'
          ]
        }
      }
    }
  };

  async.waterfall([
    function checkSolc(next) {
      const solc = shelljs.which('solc');
      if (!solc) {
        logger.error('solc is not installed on your machine');
        logger.info('You can install it by following the instructions on: http://solidity.readthedocs.io/en/latest/installing-solidity.html');
        return next('Compiler not installed');
      }
      logger.info("compiling solidity contracts with command line solc...");
      next();
    },

    function getContentAndRemappings(next) {
      async.each(contractFiles, (file, eachCb) => {
        file.prepareForCompilation(options.isCoverage).then((content) => {
          // add contract directory and all it's recusrive import direcotries to allowed directories
          let dir = path.dirname(file.path);
          if (!allowedDirectories.includes(dir)) allowedDirectories.push(dir);

          file.importRemappings.forEach((importRemapping) => {
            dir = path.dirname(importRemapping.target);
            if (!allowedDirectories.includes(dir)) allowedDirectories.push(dir);

            const remapping = `${importRemapping.prefix}=${importRemapping.target}`;
            if (!remappings.includes(remapping)) {
              remappings.push(remapping);
            }
          });

          // TODO change this to Embark's utils function once embark-solc is in the mono-repo
          compilationSettings.sources[file.path.replace(/\\/g, '/')] = {
            content: content.replace(/\r\n/g, '\n')
          };

          eachCb();
        }).catch(eachCb);
      }, next);
    },

    function compile(next) {
      compileSolcContract(logger, compilationSettings, allowedDirectories, (err, compileString) => {
        if (err) {
          return next(err);
        }
        let json;
        try {
          json = JSON.parse(compileString);
        } catch (e) {
          logger.error(e.message || e);
          return callback(`Compiling returned an unreadable result`);
        }

        embark.events.emit('contracts:compiled:solc', json);

        const contracts = json.contracts;

        // Check for errors
        if (json.errors) {
          let isError = false;
          json.errors.forEach(error => {
            if (error.severity === 'error') {
              isError = true;
              logger.error(error.formattedMessage);
            } else {
              logger.warn(error.formattedMessage);
            }
            logger.debug(error.message); // Print more error information in debug
          });
          if (isError) {
            return next(`Error while compiling`);
          }
        }
        next(null, contracts);
      });
    },

    function populateCompiledObject(contracts, next) {
      const compiledObject = {};
      for (let contractFile in contracts) {
        for (let contractName in contracts[contractFile]) {
          let contract = contracts[contractFile][contractName];
          let filename = contractFile;
          for (let directory of contractDirectories) {
            let match = new RegExp("^" + directory);
            filename = filename.replace(match, '');
          }

          let className = contractName;
          const contractFileMatch = className.match(/.sol:(.*)/);
          if (contractFileMatch) {
            className = contractFileMatch[1];
          }

          compiledObject[className] = {};
          compiledObject[className].code = contract.evm.bytecode.object;
          compiledObject[className].linkReferences = contract.evm.bytecode.linkReferences;
          compiledObject[className].runtimeBytecode = contract.evm.deployedBytecode.object;
          compiledObject[className].realRuntimeBytecode = contract.evm.deployedBytecode.object.slice(0, -68);
          compiledObject[className].swarmHash = contract.evm.deployedBytecode.object.slice(-68).slice(0, 64);
          compiledObject[className].gasEstimates = contract.evm.gasEstimates;
          compiledObject[className].functionHashes = contract.evm.methodIdentifiers;
          compiledObject[className].abiDefinition = contract.abi;
          compiledObject[className].userdoc = contract.userdoc;
          compiledObject[className].filename = filename;
          const normalized = path.normalize(filename);
          const origContract = contractFiles.find(contractFile => normalized.includes(path.normalize(contractFile.originalPath)));
          if (origContract) {
            compiledObject[className].originalFilename = path.normalize(origContract.originalPath);
          }
        }
      }

      next(null, compiledObject);
    }

  ], (err, compiledObject) => {
    callback(err, compiledObject);

    if (outputBinary) {
      embark.events.once("outputDone", () => {
        async.eachOf(compiledObject, (contract, className, eachCb) => {
          fs.writeFile(path.join(outputDir, className + ".bin"), compiledObject[className].code, eachCb);
        }, (err) => {
          if (err) {
            logger.error("Error writing binary file", err.message || err);
          }
        });
      });
    }
  });
}

module.exports = {
  compileSolc,
  compileSolcContract,
  getSolcVersion
};
