const async = require('async');
const fs = require('./fs.js');
const path = require('path');
const request = require('request');
const utils = require('../utils/utils');

class File {

  constructor (options) {
    this.filename = options.filename.replace(/\\/g, '/');
    this.type = options.type;
    this.path = options.path;
    this.basedir = options.basedir;
    this.resolver = options.resolver;
  }

  parseFileForImport(content, isHttpContract, callback) {
    const self = this;
    if (typeof isHttpContract === 'function') {
      callback = isHttpContract;
      isHttpContract = false;
    }
    if (self.filename.indexOf('.sol') < 0) {
      // Only supported in Solidity
      return callback(null, content);
    }
    const regex = /import ["|']([-a-zA-Z0-9@:%_+.~#?&\/=]+)["|'];/g;
    let matches;
    const filesToDownload = [];
    const pathWithoutFile = path.dirname(self.path);
    while ((matches = regex.exec(content))) {
      const httpFileObj = utils.getExternalContractUrl(matches[1]);
      const fileObj = {
        fileRelativePath: path.join(path.dirname(self.filename), matches[1]),
        url: `${pathWithoutFile}/${matches[1]}`
      };
      if (httpFileObj) {
        // Replace http import by filePath import in content
        content = content.replace(matches[1], httpFileObj.filePath);

        fileObj.fileRelativePath = httpFileObj.filePath;
        fileObj.url = httpFileObj.url;
      } else if (!isHttpContract) {
        // Just a normal import
        continue;
      }
      filesToDownload.push(fileObj);
    }

    if (self.downloadedImports) {
      // We already parsed this file
      return callback(null, content);
    }
    self.downloadedImports = true;
    async.each(filesToDownload, ((fileObj, eachCb) => {
      self.downloadFile(fileObj.fileRelativePath, fileObj.url, (_content) => {
        eachCb();
      });
    }), (err) => {
      callback(err, content);
    });
  }

  downloadFile (filename, url, callback) {
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
        self.parseFileForImport(content, true, (err) => {
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
    let content;
    if (this.type === File.types.embark_internal) {
      content = fs.readFileSync(fs.embarkPath(this.path)).toString();
    } else if (this.type === File.types.dapp_file) {
      content = fs.readFileSync(this.path).toString();
    } else if (this.type === File.types.custom) {
      return this.resolver((theContent) => {
        this.parseFileForImport(theContent, (err, newContent) => {
          callback(newContent);
        });
      });
    } else if (this.type === File.types.http) {
      return this.downloadFile(this.filename, this.path, (content) => {
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
    return this.parseFileForImport(content, (err, newContent) => {
      callback(newContent);
    });
  }

}

File.types = {
  embark_internal: 'embark_internal',
  dapp_file: 'dapp_file',
  custom: 'custom',
  http: 'http'
};

module.exports = File;
