/*global web3*/
const fs = require('../../core/fs');
const ContractSources = require('./contract_sources');

// Set up the web3 extension
web3.extend({
  property: 'debug',
  methods: [{name: 'traceTransaction', call: 'debug_traceTransaction', params: 2}]
});

class CodeCoverage {
  constructor(embark, _options) {
    this.events = embark.events;
    this.logger = embark.logger;

    embark.events.on('contracts:compile:solc', this.compileSolc.bind(this));
    embark.events.on('contracts:compiled:solc', this.compiledSolc.bind(this));
    embark.events.on('contracts:run:solc', this.runSolc.bind(this));
    embark.events.on('block:header', this.runSolc.bind(this));

    this.seenTransactions = {};
    this.coverageReport = {};
    this.contractSources = new ContractSources([]);

    this.dotEmbarkPath = fs.dappPath('.embark');
    this.coverageReportPath = fs.dappPath('.embark', 'coverage.json');
  }

  compileSolc(input) {
    Object.keys(input.sources).forEach((file) => {
      this.contractSources.addFile(file, input.sources[file].content);
    });
  }

  compiledSolc(output) {
    this.contractSources.parseSolcOutput(output);
  }

  updateCoverageReport() {
    fs.mkdirpSync(this.dotEmbarkPath);
    fs.writeFileSync(this.coverageReportPath, JSON.stringify(this.coverageReport));
  }

  async runSolc(receipt) {
    let block = await web3.eth.getBlock(receipt.number);
    if(block.transactions.length == 0) return;

    let requests = [];
    for(let i in block.transactions) {
      var txHash = block.transactions[i];

      if(this.seenTransactions[txHash]) return;

      this.seenTransactions[txHash] = true;
      requests.push(web3.debug.traceTransaction(txHash, {}));
    }

    let traces = await Promise.all(requests);

    for(let i in traces) {
      this.coverageReport = this.contractSources.generateCodeCoverage(traces[i]);
    }

    this.updateCoverageReport();
  }
}

module.exports = CodeCoverage;
