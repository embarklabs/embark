"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _assign = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/assign"));

const async = require("./utils/async_extend.js");

class Compiler {
  constructor(embark, options) {
    this.logger = void 0;
    this.plugins = void 0;
    this.isCoverage = void 0;
    this.logger = embark.logger;
    this.plugins = options.plugins;
    this.isCoverage = options.isCoverage;
    embark.events.setCommandHandler("compiler:contracts", this.compile_contracts.bind(this));
  }

  compile_contracts(contractFiles, cb) {
    if (contractFiles.length === 0) {
      return cb(null, {});
    }

    const compiledObject = {};
    const compilerOptions = {
      isCoverage: this.isCoverage
    };
    async.eachObject(this.getAvailableCompilers(), (extension, compilers, next) => {
      const matchingFiles = contractFiles.filter(this.filesMatchingExtension(extension));

      if (matchingFiles.length === 0) {
        return next();
      }

      async.someLimit(compilers, 1, (compiler, someCb) => {
        compiler.call(compiler, matchingFiles, compilerOptions, (err, compileResult) => {
          if (err) {
            return someCb(err);
          }

          if (compileResult === false) {
            // Compiler not compatible, trying the next one
            return someCb(null, false);
          }

          (0, _assign.default)(compiledObject, compileResult);
          someCb(null, true);
        });
      }, (err, result) => {
        if (err) {
          return next(err);
        }

        if (!result) {
          // No compiler was compatible
          return next(new Error(__("No installed compiler was compatible with your version of %s files", extension)));
        }

        next();
      });
    }, err => {
      contractFiles.filter(f => !f.compiled).forEach(file => {
        this.logger.warn(__("%s doesn't have a compatible contract compiler. Maybe a plugin exists for it.", file.path));
      });
      cb(err, compiledObject);
    });
  }

  getAvailableCompilers() {
    const available_compilers = {};
    this.plugins.getPluginsProperty("compilers", "compilers").forEach(compilerObject => {
      if (!available_compilers[compilerObject.extension]) {
        available_compilers[compilerObject.extension] = [];
      }

      available_compilers[compilerObject.extension].unshift(compilerObject.cb);
    });
    return available_compilers;
  }

  filesMatchingExtension(extension) {
    return file => {
      const fileMatch = file.path.match(/\.[0-9a-z]+$/);

      if (fileMatch && fileMatch[0] === extension) {
        file.compiled = true;
        return true;
      }

      return false;
    };
  }

}

module.exports = Compiler;
//# sourceMappingURL=index.js.map