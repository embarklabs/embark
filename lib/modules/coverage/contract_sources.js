const fs = require('fs');
const path = require('path');

const ContractSource = require('./contract_source');

class ContractSources {
  constructor(files) {
    this.files = {};

    switch(Object.prototype.toString.call(files)) {
      case '[object Object]':
        Object.keys(files).forEach((file) => {
          var basename = path.basename(file);
          this.files[basename] = new ContractSource(basename, files[file]);
        });

        break;
      case '[object String]':
        // No 'break' statement here on purpose, as it shares
        // the logic below.
        files = [files];

      case '[object Array]':
        files.forEach((file) => {
          var basename = path.basename(file);
          try {
            var content = fs.readFileSync(file).toString();
            this.files[basename] = new ContractSource(basename, content);
          } catch(e) {
            throw new Error(`Error loading ${file}: ${e.code}`);
          }
        });
        break;
    }
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
      var basename = path.basename(file);
      var contractSource = this.files[basename];
      if(!contractSource){
        continue; // TODO CHECK THIS LOGIC
        throw new Error(`Can't attribute output to ${file}: file has not been read in.`);
      }

      contractSource.parseSolcOutput(output.sources[file], output.contracts[file]);
    }
  }

  generateCodeCoverage(trace) {
    var coverageReport = {};

    for(var file in this.files) {
      var contractSource = this.files[file];
      coverageReport[file] = contractSource.generateCodeCoverage(trace);
    }

    if(!this.coverageReport) {
      this.coverageReport = coverageReport;
      return this.coverageReport;
    }

    // We already have a previous coverage report, so we're merging results here.
    Object.keys(coverageReport).forEach((file) => {
      if(!this.coverageReport[file]) {
        this.coverageReport[file] = coverageReport[file];
        return;
      }

      // Increment counters for statements, functions and lines
      ['s', 'f', 'l'].forEach((countType) => {
        Object.keys(coverageReport[file][countType]).forEach((id) => {
          this.coverageReport[file][countType][id] += coverageReport[file][countType][id];
        });
      });

      // Branch counts are tracked in a different manner so we'll do these now
      Object.keys(coverageReport[file].b).forEach((id) => {
        this.coverageReport[file].b[id][0] += coverageReport[file].b[id][0];
        this.coverageReport[file].b[id][1] += coverageReport[file].b[id][1];
      });
    });

    return this.coverageReport;
  }
}

module.exports = ContractSources;
