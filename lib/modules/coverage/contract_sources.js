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
          this.files[basename] = new ContractSource(basename, file, files[file]);
        });

        break;
      case '[object String]':
        // No 'break' statement here on purpose, as it shares
        // the logic below.
        files = [files];
        // falls through

      case '[object Array]':
        files.forEach((file) => {
          var basename = path.basename(file);
          try {
            var content = fs.readFileSync(file).toString();
            this.files[basename] = new ContractSource(basename, file, content);
          } catch(e) {
            throw new Error(`Error loading ${file}: ${e.code}`);
          }
        });
        break;

      default:
        throw new Error(`Don't know how to initialize with ${Object.prototype.toString.call(files)}`);
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
      var contractSource = this.files[path.basename(file)];
      if(!contractSource) continue;

      contractSource.parseSolcOutput(output.sources[file], output.contracts[file]);
    }
  }

  generateCodeCoverage(trace) {
    var coverageReport = {};

    for(var file in this.files) {
      coverageReport[file] = this.files[file].generateCodeCoverage(trace);
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
