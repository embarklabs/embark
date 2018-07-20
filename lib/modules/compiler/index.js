let async = require('../../utils/async_extend.js');

class Compiler {
  constructor(embark, options) {
    const self = this;
    this.plugins = options.plugins;
    this.events = embark.events;
    this.logger = embark.logger;

    this.events.setCommandHandler("compiler:contracts", function(contractFiles, cb) {
      self.compile_contracts(contractFiles, cb);
    });

  }

  compile_contracts(contractFiles, cb) {
    const self = this;
    let available_compilers = {};

    if (contractFiles.length === 0) {
      return cb(null, {});
    }

    let pluginCompilers = self.plugins.getPluginsProperty('compilers', 'compilers');
    console.dir(pluginCompilers);
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

        if (!matchingFiles || !matchingFiles.length) {
          return callback();
        }
        compiler.call(compiler, matchingFiles, function (err, compileResult) {
          Object.assign(compiledObject, compileResult);
          callback(err, compileResult);
        });
      },
      function (err) {
        contractFiles.forEach(file => {
          if (!file.compiled) {
            self.logger.warn(__("%s doesn't have a compatible contract compiler. Maybe a plugin exists for it.", file.filename));
          }
        });

        cb(err, compiledObject);
      }
    );
  }
}

module.exports = Compiler;
