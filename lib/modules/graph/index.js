const Viz = require('viz.js');
const fs = require('fs');

// TODO: refactor this class to use the plugin api and not refeneences directly
class GraphGenerator {
  constructor(embark, options) {
    const self = this;
    this.events = embark.events;
    // TODO: this is a very bad dependency to have here, needs to be refactored to use events, etc..
    this.engine = options.engine;

    this.events.setCommandHandler("graph:create", function(options, cb) {
      self.generate(options);
      cb();
    });
  }

  generate(options) {
    let id = 0;
    let contractString = "";
    let relationshipString = "";
    let idMapping = {};
    let contractInheritance = {};

    for (let contract in this.engine.contractsManager.contracts) {
      if(options.skipUndeployed && !this.engine.contractsManager.contracts[contract].deploy) continue;

      id++;

      idMapping[contract] = id;

      let contractLabel = "";

      contractLabel += `${contract}`;
      let tooltip = contract;

      if(this.engine.contractsManager.contracts[contract].instanceOf !== undefined &&
        this.engine.contractsManager.contracts[this.engine.contractsManager.contracts[contract].instanceOf] !== undefined){
        contractInheritance[contract] = this.engine.contractsManager.contracts[contract].instanceOf;
        contractLabel += ": " + this.engine.contractsManager.contracts[contract].instanceOf;
        tooltip += " instance of " + this.engine.contractsManager.contracts[contract].instanceOf; 
      } else {
        if(!(options.skipFunctions === true && options.skipEvents === true)) contractLabel += "|";

        for(let i = 0; i < this.engine.contractsManager.contracts[contract].abiDefinition.length; i++){
          let abiDef = this.engine.contractsManager.contracts[contract].abiDefinition[i];
          if(abiDef.type == 'event' && options.skipEvents) continue;
          if(['constructor', 'fallback'].indexOf(abiDef.type) > -1 && options.skipFunctions) continue;

          switch(abiDef.type){
            case 'fallback': 
              contractLabel += "«fallback»()\\l";
              break;
            case 'constructor':
              contractLabel += "«constructor»(";
              abiDef.inputs.forEach(function(elem, index){
                contractLabel += (index == 0 ? "" : ", ") + elem.type;
              });
              contractLabel += ")\\l";
              break;
            case 'event':
              contractLabel += "«event»" + abiDef.name  + "(";
              abiDef.inputs.forEach(function(elem, index){
                contractLabel += (index == 0 ? "" : ", ") + elem.type;
              });
              contractLabel += ")\\l";
              break;
            default: break;
          }       
        }

        let fHashes = this.engine.contractsManager.contracts[contract].functionHashes;
        if(fHashes != {} && fHashes != undefined && !options.skipFunctions){
          for(let method in this.engine.contractsManager.contracts[contract].functionHashes){
            contractLabel += method + '\\l';
          }
        }
      }

      let others = '';
      if(!this.engine.contractsManager.contracts[contract].deploy){
        others = 'fontcolor="#c3c3c3", color="#a0a0a0"';
        tooltip += " (not deployed)"; 
      }

      contractString += `${id}[label = "{${contractLabel}}", tooltip="${tooltip}", fillcolor=gray95, ${others}]\n`;

    }

    for (let c in this.engine.contractsManager.contractDependencies){            
      let contractDependencies = Array.from(new Set(this.engine.contractsManager.contractDependencies[c]));
      contractDependencies.forEach((d) => {
        if(idMapping[c] !== undefined && idMapping[d] !== undefined){
          if((options.skipUndeployed && this.engine.contractsManager.contracts[c].deploy && this.engine.contractsManager.contracts[d].deploy) || !options.skipUndeployed){
            relationshipString += `${idMapping[d]}->${idMapping[c]}[constraint=true, arrowtail=diamond, tooltip="${c} uses ${d}"]\n`;
          }
        }
      });
    }

    for (let c in contractInheritance){
      if(options.skipUndeployed && !this.engine.contractsManager.contracts[contractInheritance[c]].deploy) continue;

      relationshipString += `${idMapping[contractInheritance[c]]}->${idMapping[c]}[tooltip="${c} instance of ${contractInheritance[c]}"]\n`;
    }

    let dot = `
        digraph Contracts {
            node[shape=record,style=filled]
            edge[dir=back, arrowtail=empty]
            ${contractString}
            ${relationshipString}
        }`;

    let svg = Viz(dot);

    let filename = "diagram.svg";

    fs.writeFileSync(filename, svg, (err) => {
      if (err) throw err;
    });


  }
}

module.exports = GraphGenerator;
