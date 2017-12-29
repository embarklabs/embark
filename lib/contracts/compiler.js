/*jshint esversion: 6, loopfunc: true */
let async = require('../utils/async_extend.js');

class Compiler {
  constructor(options) {
    this.plugins = options.plugins;
    this.logger = options.logger;
  }

  compile_contracts(contractFiles, cb) {
    let available_compilers = {};

    let pluginCompilers = this.plugins.getPluginsProperty('compilers', 'compilers');
    pluginCompilers.forEach(function (compilerObject) {
      available_compilers[compilerObject.extension] = compilerObject.cb;
    });

    let compiledObject = {};

    async.eachObject(available_compilers,
      function (extension, compiler, callback) {
        // TODO: warn about files it doesn't know how to compile
        let matchingFiles = contractFiles.filter(function (file) {
          let fileMatch = file.filename.match(/\.[0-9a-z]+$/);
          return (fileMatch && (fileMatch[0] === extension));
        });

        compiler.call(compiler, matchingFiles || [], function (err, compileResult) {
          Object.assign(compiledObject, compileResult);
          callback(err, compileResult);
        });
      },
      function (err) {
        cb(err, compiledObject);
      }
    );
  }
}

module.exports = Compiler;
