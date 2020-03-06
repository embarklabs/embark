import { warnIfPackageNotDefinedLocally } from 'embark-utils';

const async = require('async');
const Viz = require('viz.js');
const { Module, render } = require('viz.js/full.render.js');

class GraphGenerator {
  constructor(embark, _options) {
    this.embark = embark;
    this.events = embark.events;

    this.events.setCommandHandler("graph:create", this.generate.bind(this));
    warnIfPackageNotDefinedLocally("embark-graph", this.embark.logger.warn.bind(this.embark.logger), this.embark.config.embarkConfig);
  }

  /*eslint complexity: ["error", 21]*/
  generate(options, cb) {
    const self = this;
    let id = 0;
    let contractString = "";
    let relationshipString = "";
    let idMapping = {};
    let contractInheritance = {};
    let contractsDependencies = {};
    this.contracts = [];

    async.waterfall([
      function getContractList(next) {
        self.events.request('contracts:list', (err, contracts) => {
          self.contracts = contracts;
          next();
        });
      },
      function getContractsDependencies(next) {
        self.events.request('contracts:dependencies', (err, _contractsDependencies) => {
          contractsDependencies = _contractsDependencies;
          next();
        });
      },
      function (next) {
        for (let contract of self.contracts) {
          if (options.skipUndeployed && !contract.deploy) continue;

          id++;

          idMapping[contract.className] = id;

          let contractLabel = "";

          contractLabel += `${contract.className}`;
          let tooltip = contract.className;

          if (contract.instanceOf !== undefined && self.getContract(contract.instanceOf) !== undefined) {
            contractInheritance[contract.className] = contract.instanceOf;
            contractLabel += ": " + contract.instanceOf;
            tooltip += " instance of " + contract.instanceOf;
          } else {
            if (!(options.skipFunctions === true && options.skipEvents === true)) contractLabel += "|";

            for (let i = 0; i < contract.abiDefinition.length; i++) {
              let abiDef = contract.abiDefinition[i];
              if (abiDef.type === 'event' && options.skipEvents) continue;
              if (['constructor', 'fallback'].indexOf(abiDef.type) > -1 && options.skipFunctions) continue;

              switch(abiDef.type){
                case 'fallback':
                  contractLabel += "«fallback»()\\l";
                  break;
                case 'constructor':
                  contractLabel += "«constructor»(";
                  abiDef.inputs.forEach(function(elem, index){
                    contractLabel += (index === 0 ? "" : ", ") + elem.type;
                  });
                  contractLabel += ")\\l";
                  break;
                case 'event':
                  contractLabel += "«event»" + abiDef.name  + "(";
                  abiDef.inputs.forEach(function(elem, index){
                    contractLabel += (index === 0 ? "" : ", ") + elem.type;
                  });
                  contractLabel += ")\\l";
                  break;
                default: break;
              }
            }

            let fHashes = contract.functionHashes;
            if (fHashes !== {} && fHashes !== undefined && !options.skipFunctions){
              for (let method in contract.functionHashes){
                contractLabel += method + '\\l';
              }
            }
          }

          let others = '';
          if (!contract.deploy){
            others = 'fontcolor="#c3c3c3", color="#a0a0a0"';
            tooltip += " (not deployed)";
          }

          contractString += `${id}[label = "{${contractLabel}}", tooltip="${tooltip}", fillcolor=gray95, ${others}]\n`;
        }
        next();
      },
      function (next) {
        for (let c in contractsDependencies) {
          let contractDependencies = Array.from(new Set(contractsDependencies[c]));
          contractDependencies.forEach((d) => {
            if (idMapping[c] !== undefined && idMapping[d] !== undefined) {
              if ((options.skipUndeployed && self.getContract(c).deploy && self.getContract(d).deploy) || !options.skipUndeployed) {
                relationshipString += `${idMapping[d]}->${idMapping[c]}[constraint=true, arrowtail=diamond, tooltip="${c} uses ${d}"]\n`;
              }
            }
          });
        }
        next();
      },
      function (next) {
        for (let c in contractInheritance){
          if(options.skipUndeployed && !self.getContract(contractInheritance[c]).deploy) continue;

          relationshipString += `${idMapping[contractInheritance[c]]}->${idMapping[c]}[tooltip="${c} instance of ${contractInheritance[c]}"]\n`;
        }
        next();
      },
      function (next) {
        const dot = `
        digraph Contracts {
            node[shape=record,style=filled]
            edge[dir=back, arrowtail=empty]
            ${contractString}
            ${relationshipString}
        }`;

        const viz = new Viz({ Module, render });
        viz.renderString(dot)
          .then(svg => self.embark.fs.writeFile(options.output, svg, next))
          .catch(next);
      }
    ], function(err) {
      if (err) return cb(err);
      cb();
    });
  }

  getContract(contractName) {
    return this.contracts.find((contract) => { return contract.className === contractName; });
  }
}

module.exports = GraphGenerator;
