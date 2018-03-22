const Viz = require('viz.js');
const fs = require('fs');

class GraphGenerator {
    constructor(engine) {
        this.engine = engine;
    }

    generate() {
        let id = 0;
        let contractString = "";

        for (let contract in this.engine.contractsManager.contracts) {
            id++;
            let contractLabel = "";

            contractLabel += `${contract}`;

            let fHashes = this.engine.contractsManager.contracts[contract].functionHashes;
            if(fHashes != {} && fHashes != undefined){
                contractLabel += "|";
                for(let method in this.engine.contractsManager.contracts[contract].functionHashes){
                    contractLabel += method + '\\l';
                }
            }

            for(let i = 0; i < this.engine.contractsManager.contracts[contract].abiDefinition.length; i++){
                if(this.engine.contractsManager.contracts[contract].abiDefinition[i].type == 'fallback')
                    contractLabel += "«fallback»()" + '\\l';
            }

        /*if(c.methods.length > 0){
            contractLabel += "|";
            c.methods.forEach(function(a){
                contractLabel += a + '\\l';
            })
            
        } */

            contractString += `${id}[label = "{${contractLabel}}"]`
            contractString += "\n";
        }


        let dot = `
        digraph hierarchy {
        node[shape=record,style=filled,fillcolor=gray95]
        edge[dir=back, arrowtail=empty]
            ${contractString}
        }`;

        let svg = Viz(dot);
        
        let filename = "diagram.svg";

        fs.writeFileSync(filename, svg, (err) => {
            if (err) throw err;
        });


    }
}

module.exports = GraphGenerator;
