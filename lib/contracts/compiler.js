let async = require('../utils/async_extend.js');

class Compiler {
  constructor(options) {
    this.plugins = options.plugins;
    this.logger = options.logger;
  }

  compile_contracts(contractFiles, cb) {
    const self = this;
    let available_compilers = {};

    let pluginCompilers = self.plugins.getPluginsProperty('compilers', 'compilers');
    pluginCompilers.forEach(function (compilerObject) {
      available_compilers[compilerObject.extension] = compilerObject.cb;
    });

    let compiledObject = {};

    async.eachObject(available_compilers,
      function (extension, compiler, callback) {
        let matchingFiles = contractFiles.filter(function (file) {
          let fileMatch = file.filename.match(/\.[0-9a-z]+$/);
          if (fileMatch && (fileMatch[0] === extension)) {
            file.compiled = true;
            return true;
          }
          return false;
        });

        compiler.call(compiler, matchingFiles || [], function (err, compileResult) {
          Object.assign(compiledObject, compileResult);
          callback(err, compileResult);
        });
      },
      function (err) {
        contractFiles.forEach(file => {
          if (!file.compiled) {
              self.logger.warn(`${file.filename} doesn't have a compatible contract compiler. Maybe a plugin exists for it.`);
          }
        });

        cb(err, compiledObject);
      }
    );
  }
}

module.exports = Compiler;
