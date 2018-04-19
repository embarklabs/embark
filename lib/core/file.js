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

  parseFileForImport(content, callback) {
    const self = this;
    if (self.filename.indexOf('.sol') < 0) {
      // Only supported in Solidity
      return callback();
    }
    const regex = /import "([a-zA-Z0-9_\-.\\\/]+)";/g;
    let matches;
    const filesToDownload = [];
    const pathWithoutFile = path.dirname(self.path);
    while ((matches = regex.exec(content))) {
      filesToDownload.push({
        fileRelativePath: path.join(path.dirname(self.filename), matches[1]),
        url: `${pathWithoutFile}/${matches[1]}`
      });
    }

    async.each(filesToDownload, ((fileObj, eachCb) => {
      self.downloadFile(fileObj.fileRelativePath, fileObj.url, (_content) => {
        eachCb();
      });
    }), callback);
  }

  downloadFile (filename, url, callback) {
    console.log('Downloading:', filename, 'form', url);
    const self = this;
    async.waterfall([
      function makeTheDir(next) {
        fs.mkdirp(path.dirname(filename), (err) => {
          if (err) {
            return next(err);
          }
          next();
        });
      },
      function downloadTheFile(next) {
        request(url)
          .on('response', function (response) {
            if (response.statusCode !== 200) {
              next('Getting file returned code ' + response.statusCode);
            }
          })
          .on('error', next)
          .pipe(fs.createWriteStream(filename))
          .on('finish', next);
      },
      function readFile(next) {
        fs.readFile(filename, next);
      },
      function parseForImports(content, next) {
        self.parseFileForImport(content, (err) => {
          next(err, content);
        });
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
      this.downloadFile(this.filename, this.path, (content) => {
        if (!content) {
          return callback(content);
        }
        this.path = this.filename;
        this.type = File.types.dapp_file;
        callback(content);
      });
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
