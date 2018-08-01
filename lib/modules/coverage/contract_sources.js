const fs = require('fs');

const ContractSource = require('./contract_source');

class ContractSources {
  constructor(files) {
    if(!Array.isArray(files))
      files = [files];

    this.files = {};

    files.forEach((file) => {
      try {
        var content = fs.readFileSync(file).toString()
        this.files[file] = new ContractSource(file, content);
      } catch(e) {
        throw new Error(`Error loading ${file}: ${e.code}`)
      }
    });
  }

  toSolcInputs() {
    var inputs = {};

    for(var file in this.files) {
      inputs[file] = {content: this.files[file].body};
    }

    return inputs;
  }

  parseSolcOutput(output) {
    for(var file in output.contracts) {
      var contractSource = this.files[file];
      contractSource.parseSolcOutput(output.sources[file], output.contracts[file])
    }
  }

  generateCodeCoverage(trace) {
    var coverageReport = {};

    for(var file in this.files) {
      var contractSource = this.files[file];
      coverageReport[file] = contractSource.generateCodeCoverage(trace);
    }

    return coverageReport;
  }
}

module.exports = ContractSources;
