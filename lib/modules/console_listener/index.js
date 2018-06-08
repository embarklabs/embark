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
                    .map(func => {
                                return {
                                    name: func.name + 
                                            '(' + 
                                            (func.inputs ? func.inputs.map(input => input.type).join(',') : '') +
                                            ')',
                                    abi: func,
                                    functionName: func.name
                                };
                        })
                    .forEach(func => {
                        funcSignatures[utils.sha3(func.name).substring(0, 10)] = func;
                    });

                this.addressToContract[address] = {
                    name: contractName,
                    functions: funcSignatures
                };
            }
        });
    }

    listenForLogRequests(){
        if(this.ipc.ipcRole === 'server'){
            this.ipc.on('log', (request) => {
                if(request.type == 'contract-log'){

                    let {address, data, transactionHash, blockNumber, gasUsed, status} = request;
                    if(!this.addressToContract[address]){
                        this._updateContractList();
                    }

                    let name = this.addressToContract[address].name;
                    let func = this.addressToContract[address].functions[data.substring(0, 10)]; 
                    let functionName = func.functionName;

                    let decodedParameters = utils.decodeParams(func.abi.inputs, data.substring(10));
                    let paramString = "";
                    if(func.abi.inputs){
                        func.abi.inputs.forEach((input) => {
                            let quote = input.type.indexOf("int") == -1 ? '"' : '';
                            paramString +=   quote + decodedParameters[input.name] + quote + ", ";
                        });
                        paramString = paramString.substring(0, paramString.length - 2);
                    }

                    gasUsed = utils.hexToNumber(gasUsed);
                    blockNumber = utils.hexToNumber(blockNumber);
                    
                    this.logger.debug(`${name}.${functionName}(${paramString}) : ${transactionHash} | gas:${gasUsed} | blk:${blockNumber} | status:${status}`);
                } else {
                    this.logger.debug(request);
                }
            });
        }
    }   
}

module.exports = ConsoleListener;
