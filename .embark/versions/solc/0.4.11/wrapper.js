var translate = require('./translate.js');
var requireFromString = require('require-from-string');
var https = require('https');
var MemoryStream = require('memorystream');

function setupMethods (soljson) {
  var compileJSON = soljson.cwrap('compileJSON', 'string', ['string', 'number']);
  var compileJSONMulti = null;
  if ('_compileJSONMulti' in soljson) {
    compileJSONMulti = soljson.cwrap('compileJSONMulti', 'string', ['string', 'number']);
  }
  var compileJSONCallback = null;
  var compileStandard = null;
  if (('_compileJSONCallback' in soljson) || ('_compileStandard' in soljson)) {
    var copyString = function (str, ptr) {
      var buffer = soljson._malloc(str.length + 1);
      soljson.writeStringToMemory(str, buffer);
      soljson.setValue(ptr, buffer, '*');
    };
    var wrapCallback = function (callback) {
      return function (path, contents, error) {
        var result = callback(soljson.Pointer_stringify(path));
        if (typeof result.contents === 'string') {
          copyString(result.contents, contents);
        }
        if (typeof result.error === 'string') {
          copyString(result.error, error);
        }
      };
    };

    // This calls compile() with args || cb
    var runWithReadCallback = function (readCallback, compile, args) {
      if (readCallback === undefined) {
        readCallback = function (path) {
          return {
            error: 'File import callback not supported'
          };
        };
      }
      var cb = soljson.Runtime.addFunction(wrapCallback(readCallback));
      var output;
      try {
        args.push(cb);
        output = compile.apply(undefined, args);
      } catch (e) {
        soljson.Runtime.removeFunction(cb);
        throw e;
      }
      soljson.Runtime.removeFunction(cb);
      return output;
    };

    var compileInternal = soljson.cwrap('compileJSONCallback', 'string', ['string', 'number', 'number']);
    compileJSONCallback = function (input, optimize, readCallback) {
      return runWithReadCallback(readCallback, compileInternal, [ input, optimize ]);
    };
    if ('_compileStandard' in soljson) {
      var compileStandardInternal = soljson.cwrap('compileStandard', 'string', ['string', 'number']);
      compileStandard = function (input, readCallback) {
        return runWithReadCallback(readCallback, compileStandardInternal, [ input ]);
      };
    }
  }

  var compile = function (input, optimise, readCallback) {
    var result = '';
    if (readCallback !== undefined && compileJSONCallback !== null) {
      result = compileJSONCallback(JSON.stringify(input), optimise, readCallback);
    } else if (typeof input !== 'string' && compileJSONMulti !== null) {
      result = compileJSONMulti(JSON.stringify(input), optimise);
    } else {
      result = compileJSON(input, optimise);
    }
    return JSON.parse(result);
  };

  // Expects a Standard JSON I/O but supports old compilers
  var compileStandardWrapper = function (input, readCallback) {
    if (compileStandard !== null) {
      return compileStandard(input, readCallback);
    }

    function formatFatalError (message) {
      return JSON.stringify({
        errors: [
          {
            'type': 'SOLCError',
            'component': 'solcjs',
            'severity': 'error',
            'message': message,
            'formattedMessage': 'Error' + message
          }
        ]
      });
    }

    input = JSON.parse(input);

    if (input['language'] !== 'Solidity') {
      return formatFatalError('Only Solidity sources are supported');
    }

    if (input['sources'] == null) {
      return formatFatalError('No input specified');
    }

    // Bail out early
    if ((input['sources'].length > 1) && (compileJSONMulti === null)) {
      return formatFatalError('Multiple sources provided, but compiler only supports single input');
    }

    function isOptimizerEnabled (input) {
      return input['settings'] && input['settings']['optimizer'] && input['settings']['optimizer']['enabled'];
    }

    function translateSources (input) {
      var sources = {};
      for (var source in input['sources']) {
        if (input['sources'][source]['content'] !== null) {
          sources[source] = input['sources'][source]['content'];
        } else {
          // force failure
          return null;
        }
      }
      return sources;
    }

    function translateOutput (output) {
      output = translate.translateJsonCompilerOutput(JSON.parse(output));
      if (output == null) {
        return formatFatalError('Failed to process output');
      }
      return JSON.stringify(output);
    }

    var sources = translateSources(input);
    if (sources === null) {
      return formatFatalError('Failed to process sources');
    }

    // Try to wrap around old versions
    if (compileJSONCallback !== null) {
      return translateOutput(compileJSONCallback(JSON.stringify({ 'sources': sources }), isOptimizerEnabled(input), readCallback));
    }

    if (compileJSONMulti !== null) {
      return translateOutput(compileJSONMulti(JSON.stringify({ 'sources': sources }), isOptimizerEnabled(input)));
    }

    // Try our luck with an ancient compiler
    return translateOutput(compileJSON(sources[0], isOptimizerEnabled(input)));
  };

  var linkBytecode = function (bytecode, libraries) {
    for (var libraryName in libraries) {
      // truncate to 37 characters
      var internalName = libraryName.slice(0, 36);
      // prefix and suffix with __
      var libLabel = '__' + internalName + Array(37 - internalName.length).join('_') + '__';

      var hexAddress = libraries[libraryName];
      if (hexAddress.slice(0, 2) !== '0x' || hexAddress.length > 42) {
        throw new Error('Invalid address specified for ' + libraryName);
      }
      // remove 0x prefix
      hexAddress = hexAddress.slice(2);
      hexAddress = Array(40 - hexAddress.length + 1).join('0') + hexAddress;

      while (bytecode.indexOf(libLabel) >= 0) {
        bytecode = bytecode.replace(libLabel, hexAddress);
      }
    }

    return bytecode;
  };

  var version = soljson.cwrap('version', 'string', []);

  return {
    version: version,
    compile: compile,
    compileStandard: compileStandard,
    compileStandardWrapper: compileStandardWrapper,
    linkBytecode: linkBytecode,
    supportsMulti: compileJSONMulti !== null,
    supportsImportCallback: compileJSONCallback !== null,
    supportsStandard: compileStandard !== null,
    // Use the given version if available.
    useVersion: function (versionString) {
      return setupMethods(require('./bin/soljson-' + versionString + '.js'));
    },
    // Loads the compiler of the given version from the github repository
    // instead of from the local filesystem.
    loadRemoteVersion: function (versionString, cb) {
      var mem = new MemoryStream(null, {readable: false});
      var url = 'https://ethereum.github.io/solc-bin/bin/soljson-' + versionString + '.js';
      https.get(url, function (response) {
        if (response.statusCode !== 200) {
          cb('Error retrieving binary: ' + response.statusMessage);
        } else {
          response.pipe(mem);
          response.on('end', function () {
            cb(null, setupMethods(requireFromString(mem.toString(), 'soljson-' + versionString + '.js')));
          });
        }
      }).on('error', function (error) {
        cb(error);
      });
    },
    // Use this if you want to add wrapper functions around the pure module.
    setupMethods: setupMethods
  };
}

module.exports = setupMethods;
