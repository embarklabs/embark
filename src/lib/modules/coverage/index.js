/*global web3*/
const fs = require('../../core/fs');
const ContractSources = require('./contractSources');

class CodeCoverage {
  constructor(embark, _options) {
    this.events = embark.events;
    this.logger = embark.logger;

    embark.events.on('contracts:compile:solc', this.compileSolc.bind(this));
    embark.events.on('contracts:compiled:solc', this.compiledSolc.bind(this));
    embark.events.on('contracts:run:solc', this.runSolc.bind(this));
    embark.events.on('block:header', this.runSolc.bind(this));

    embark.events.on('tests:finished', this.updateCoverageReport.bind(this));

    embark.events.on('blockchain:ready', () => {
      embark.events.request('blockchain:get', (web3) => {
        // Set up the web3 extension
        web3.extend({
          property: 'debug',
          methods: [{name: 'traceTransaction', call: 'debug_traceTransaction', params: 2}]
        });

      });
    });

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

  updateCoverageReport(cb) {
    fs.mkdirp(this.dotEmbarkPath, () => {
      fs.writeFile(this.coverageReportPath, JSON.stringify(this.coverageReport), cb);
    });
  }

  async runSolc(receipt) {
    let block = await web3.eth.getBlock(receipt.number);
    if(block.transactions.length === 0) return;

    let requests = block.transactions.reduce((acc, txHash) => {
      if(this.seenTransactions[txHash]) return;

      this.seenTransactions[txHash] = true;
      acc.push(web3.debug.traceTransaction(txHash, {}));
      return acc;
    }, []);

    let traces = await Promise.all(requests);

    traces.forEach(trace => {
      this.coverageReport = this.contractSources.generateCodeCoverage(trace);
    });
  }
}

module.exports = CodeCoverage;
