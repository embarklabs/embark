const fs = require('fs');
const path = require('path');

const ContractSource = require('./contractSource');

class ContractSources {
  constructor(files) {
    this.files = {};

    switch(Object.prototype.toString.call(files)) {
      case '[object Object]':
        Object.keys(files).forEach((file) => { this.addFile(file, files[file]); });
        break;

      case '[object String]':
        // No 'break' statement here on purpose, as it shares
        // the logic below.
        files = [files];
        // falls through

      case '[object Array]':
        files.forEach((file) => {
          const content = fs.readFileSync(file).toString();
          this.addFile(file, content);
        });
        break;

      default:
        throw new Error(`Don't know how to initialize with ${Object.prototype.toString.call(files)}`);
    }
  }

  addFile(fullPath, contents) {
    const basename = path.basename(fullPath);
    if(this.files[basename]) return;

    this.files[basename] = new ContractSource(basename, fullPath, contents);
  }

  toSolcInputs() {
    const inputs = {};

    for(const filename in this.files) {
      inputs[filename] = {content: this.files[filename].body};
    }

    return inputs;
  }

  parseSolcOutput(output) {
    for(const filename in output.contracts) {
      const contractSource = this.files[path.basename(filename)];
      if(!contractSource) continue;

      contractSource.parseSolcOutput(output.sources[filename], output.contracts[filename]);
    }
  }

  generateCodeCoverage(trace) {
    const coverageReport = {};

    for(const filename in this.files) {
      if(this.files[filename].isInterface()) continue;
      coverageReport[filename] = this.files[filename].generateCodeCoverage(trace);
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
        // FIXME in solc-tests, this is sometimes empty
        if (!this.coverageReport[file].b[id] || !this.coverageReport[file].b[id].length) {
          return;
        }
        this.coverageReport[file].b[id][0] += coverageReport[file].b[id][0];
        this.coverageReport[file].b[id][1] += coverageReport[file].b[id][1];
      });
    });

    return this.coverageReport;
  }
}

module.exports = ContractSources;
