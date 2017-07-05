let fs = require('./fs.js');

class File {

  constructor(options) {
    this.filename = options.filename;
    this.type = options.type;
    this.path = options.path;
    this.resolver = options.resolver;
  }

  content(callback) {
    if (this.type === 'embark_internal') {
      return callback(fs.readFileSync(fs.embarkPath(this.path)).toString());
    } else if (this.type === 'dapp_file') {
      return callback(fs.readFileSync(this.path).toString());
    } else if (this.type === 'custom') {
      return this.resolver(callback);
    } else {
      throw new Error("unknown file: " + this.filename);
    }
  }

}

module.exports = File;
