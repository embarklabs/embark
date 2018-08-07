const ContractSources = require('./contract_sources');

class CodeCoverage {
  constructor(embark, _options) {
    this.events = embark.events;
    this.logger = embark.logger;

    embark.events.on('contracts:compile:solc', this.compileSolc.bind(this));
    embark.events.on('contracts:compiled:solc', this.compiledSolc.bind(this));
    embark.events.on('contracts:run:solc', this.runSolc.bind(this));
    embark.registerActionForEvent('contracts:deploy:afterAll', this.deployed.bind(this));

    embark.events.on('block:header', this.runSolc.bind(this));
  }

  compileSolc(input) {
    var sources = {};

    Object.keys(input.sources).forEach((path) => {
      sources[path] = input.sources[path].content;
    });

    this.contractSources = new ContractSources(sources);
  }

  compiledSolc(output) {
    this.contractSources.parseSolcOutput(output);
  }

  runSolc(receipt) {
    console.log('runSolc');
    console.dir(receipt);
    //this.contractSources.generateCodeCoverage(trace);
  }

  deployed(cb) {
    this.events.request('contracts:list', (error, contracts) => {
      console.dir(error);
      console.dir(contracts);
      cb();
    });
  }
}

module.exports = CodeCoverage;
