const utils = require('../../utils/utils.js');

class ConsoleListener {
    constructor(embark, options) {
        this.logger = embark.logger;
        this.ipc = options.ipc;  
        this.addressToContract = [];
        this.contractsConfig = embark.config.contractsConfig;
        this.listenForLogRequests();
    }

    _updateContractList(){
        Object.keys(this.contractsConfig.contracts).forEach(contractName => {
            let contract = this.contractsConfig.contracts[contractName];
            let address = contract.deployedAddress.toLowerCase();

            if(!this.addressToContract[address]){
                let funcSignatures = {};
                contract.abiDefinition
                    .filter(func => func.type == "function")
                    .map(func => func.name + 
                                 '(' + 
                                 (func.inputs ? func.inputs.map(input => input.type).join(',') : '') +
                                 ')')
                    .forEach(func => {
                        funcSignatures[utils.sha3(func).substring(0, 10)] = func;
                    });

                this.addressToContract[address] = {
                    name: contractName,
                    functions: funcSignatures
                };
            }
        });
    }

    listenForLogRequests(){
        this.ipc.on('log', (request) => {
            if(request.type == 'contract-log'){

                let {address, data, transactionHash, blockNumber, gasUsed, status} = request;
                if(!this.addressToContract[address]){
                    this._updateContractList();
                }

                let name = this.addressToContract[address].name;
                let funcHash = this.addressToContract[address].functions[data.substring(0, 10)];
                
                gasUsed = utils.hexToNumber(gasUsed);
                blockNumber = utils.hexToNumber(blockNumber);
                
                this.logger.debug(`${name}.${funcHash} : ${transactionHash} | gas:${gasUsed} | blk:${blockNumber} | status:${status}`);
            } else {
                this.logger.debug(request);
            }
        });
    }   
}

module.exports = ConsoleListener;
