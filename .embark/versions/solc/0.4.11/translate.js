function translateErrors (ret, errors) {
  for (var error in errors) {
    var type = 'error';
    var extractType = /^(.*):(\d+):(\d+):(.*):/;
    extractType = extractType.exec(errors[error]);
    if (extractType) {
      type = extractType[4].trim();
    } else if (errors[error].indexOf(': Warning:')) {
      type = 'Warning';
    } else if (errors[error].indexOf(': Error:')) {
      type = 'Error';
    }
    ret.push({
      type: type,
      component: 'general',
      severity: (type === 'Warning') ? 'warning' : 'error',
      message: errors[error],
      formattedMessage: errors[error]
    });
  }
}

function translateGasEstimates (gasEstimates) {
  if (gasEstimates === null) {
    return 'infinite';
  }

  if (typeof gasEstimates === 'number') {
    return gasEstimates.toString();
  }

  var gasEstimatesTranslated = {};
  for (var func in gasEstimates) {
    gasEstimatesTranslated[func] = translateGasEstimates(gasEstimates[func]);
  }
  return gasEstimatesTranslated;
}

function translateJsonCompilerOutput (output) {
  var ret = {};

  ret['errors'] = [];
  translateErrors(ret['errors'], output['errors']);

  ret['contracts'] = {};
  for (var contract in output['contracts']) {
    // Split name first, can be `contract`, `:contract` or `filename:contract`
    var tmp = contract.match(/^(([^:]*):)?([^:]+)$/);
    if (tmp.length !== 4) {
      // Force abort
      return null;
    }
    var fileName = tmp[2];
    if (fileName === undefined) {
      // this is the case of `contract`
      fileName = '';
    }
    var contractName = tmp[3];

    var contractInput = output['contracts'][contract];

    var gasEstimates = contractInput['gasEstimates'];

    var contractOutput = {
      'abi': JSON.parse(contractInput['interface']),
      'metadata': contractInput['metadata'],
      'evm': {
        'legacyAssembly': contractInput['assembly'],
        'bytecode': {
          'object': contractInput['bytecode'],
          'opcodes': contractInput['opcodes'],
          'sourceMap': contractInput['srcmap']
        },
        'deployedBytecode': {
          'object': contractInput['runtimeBytecode'],
          'sourceMap': contractInput['srcmapRuntime']
        },
        'methodIdentifiers': contractInput['functionHashes'],
        'gasEstimates': {
          'creation': {
            'codeDepositCost': translateGasEstimates(gasEstimates['creation'][1]),
            'executionCost': translateGasEstimates(gasEstimates['creation'][0])
          },
          'internal': translateGasEstimates(gasEstimates['internal']),
          'external': translateGasEstimates(gasEstimates['external'])
        }
      }
    };

    if (!ret['contracts'][fileName]) {
      ret['contracts'][fileName] = {};
    }

    ret['contracts'][fileName][contractName] = contractOutput;
  }

  var sourceMap = {};
  for (var sourceId in output['sourceList']) {
    sourceMap[output['sourceList'][sourceId]] = sourceId;
  }

  ret['sources'] = {};
  for (var source in output['sources']) {
    ret['sources'][source] = {
      id: sourceMap[source],
      legacyAST: output['sources'][source]
    };
  }

  return ret;
}

module.exports = {
  translateJsonCompilerOutput: translateJsonCompilerOutput
};
