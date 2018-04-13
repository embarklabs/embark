const Viz = require('viz.js');
const fs = require('fs');

class GraphGenerator {
    constructor(engine) {
        this.engine = engine;
    }

    generate() {
        let id = 0;
        let contractString = "";
        let relationshipString = "";
        let idMapping = {};
        let contractInheritance = {};

        
        for (let contract in this.engine.contractsManager.contracts) {
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
                contractLabel += "|";

                for(let i = 0; i < this.engine.contractsManager.contracts[contract].abiDefinition.length; i++){
                    switch(this.engine.contractsManager.contracts[contract].abiDefinition[i].type){
                        case 'fallback': 
                            contractLabel += "«fallback»()\\l";
                            break;
                            case 'constructor':
                            contractLabel += "«constructor»(";
                            this.engine.contractsManager.contracts[contract].abiDefinition[i].inputs.forEach(function(elem, index){
                                contractLabel += (index == 0 ? "" : ", ") + elem.type;
                            });
                            contractLabel += ")\\l";
                            break;
                            case 'event':
                            contractLabel += "«event»" + this.engine.contractsManager.contracts[contract].abiDefinition[i].name  + "(";
                            this.engine.contractsManager.contracts[contract].abiDefinition[i].inputs.forEach(function(elem, index){
                                contractLabel += (index == 0 ? "" : ", ") + elem.type;
                            });
                            contractLabel += ")\\l";
                            break;
                        default: break;
                    }       
                }

                let fHashes = this.engine.contractsManager.contracts[contract].functionHashes;
                if(fHashes != {} && fHashes != undefined){
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
            contractDependencies.forEach(function(d){
                if(idMapping[c] !== undefined && idMapping[d] !== undefined){
                    relationshipString += `${idMapping[d]}->${idMapping[c]}[constraint=true, arrowtail=diamond, tooltip="${c} uses ${d}"]\n`;
                }
            });
        }

        for (let c in contractInheritance){
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
