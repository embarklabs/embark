const async = require('async');
const fs = require('./fs.js');
const path = require('path');
const request = require('request');

class File {

  constructor (options) {
    this.filename = options.filename;
    this.type = options.type;
    this.path = options.path;
    this.basedir = options.basedir;
    this.resolver = options.resolver;
  }

  downloadFile (callback) {
    const self = this;
    async.waterfall([
      function makeTheDir(next) {
        fs.mkdirp(path.dirname(self.filename), (err) => {
          if (err) {
            return next(err);
          }
          next();
        });
      },
      function downloadTheFile(next) {
        request(self.path)
          .on('response', function (response) {
            if (response.statusCode !== 200) {
              next('Getting file returned code ' + response.statusCode);
            }
          })
          .on('error', next)
          .pipe(fs.createWriteStream(self.filename))
          .on('finish', () => {
            self.path = self.filename;
            self.type = File.types.dapp_file;
            next();
          });
      },
      function readFile(next) {
        fs.readFile(self.path, next);
      }
    ], (err, content) => {
      if (err) {
        console.error('Error while downloading the file', err);
        return callback('');
      }
      callback(content.toString());
    });
  }

  content (callback) {
    if (this.type === File.types.embark_internal) {
      return callback(fs.readFileSync(fs.embarkPath(this.path)).toString());
    } else if (this.type === File.types.dapp_file) {
      return callback(fs.readFileSync(this.path).toString());
    } else if (this.type === File.types.custom) {
      return this.resolver(callback);
    } else if (this.type === File.types.http) {
      this.downloadFile(callback);
    } else {
      throw new Error("unknown file: " + this.filename);
    }
  }

}

File.types = {
  embark_internal: 'embark_internal',
  dapp_file: 'dapp_file',
  custom: 'custom',
  http: 'http'
};

module.exports = File;
