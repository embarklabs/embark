(function() {
  var Test, TestContract, TestContractWrapper, className, compiled_contracts, contract, contractDB, contractFile, contractFiles, fs, grunt, i, len, mm, py_exec, python, request, source, sync, web3;

  python = require('python').shell;

  web3 = require('web3');

  fs = require('fs');

  mm = require('methodmissing');

  sync = require('sync-me');

  grunt = require('grunt');

  py_exec = function(cmd) {
    return sync(python, cmd)[1].trim();
  };

  py_exec('from ethertdd import EvmContract');

  web3.setProvider(new web3.providers.HttpProvider('http://localhost:8101'));

  web3.eth.defaultAccount = web3.eth.accounts[0];

  TestContractWrapper = (function() {
    TestContractWrapper = function(contract, className, args) {
      this.contract = contract;
      this.className = className;
      this.args = args;
      this.initializeContract();
    };
    TestContractWrapper.prototype.initializeContract = function() {
      var example_abi, example_binary;
      example_abi = JSON.stringify(contract.info.abiDefinition);
      example_binary = contract.code.slice(2);
      py_exec("example_abi = '" + example_abi + "'");
      py_exec("example_abi");
      py_exec("example_binary = '" + example_binary + "'.decode('hex')");
      py_exec("example_binary");
      if (this.args === void 0) {
        py_exec(this.className + '_contract = EvmContract(example_abi, example_binary, \'' + this.className + '\')');
      } else {
        py_exec(this.className + '_contract = EvmContract(example_abi, example_binary, \'' + this.className + '\', [' + this.args.join(',') + '])');
      }
      this.contractVariable = this.className + '_contract';
    };
    TestContractWrapper.prototype.execCmd = function(method, args) {
      var arg_list, data, key, value;
      arg_list = [];
      for (key in args) {
        value = args[key];
        value = args[key];
        arg_list.push(value);
      }
      data = py_exec(this.className + '_contract.' + method + '(' + arg_list.join(',') + ')');
      return data;
    };
    return TestContractWrapper;
  })();

  TestContract = function(contract, className, args) {
    var Obj, wrapper;
    wrapper = new TestContractWrapper(contract, className, args);
    Obj = mm(wrapper, function(key, args) {
      return wrapper.execCmd(key, args);
    });
    return Obj;
  };

  contractFiles = grunt.file.expand('./app/contracts/**/*.sol');

  contractDB = {};

  for (i = 0, len = contractFiles.length; i < len; i++) {
    contractFile = contractFiles[i];
    source = fs.readFileSync(contractFile).toString();
    compiled_contracts = web3.eth.compile.solidity(source);
    for (className in compiled_contracts) {
      contract = compiled_contracts[className];
      contractDB[className] = contract;
    }
  }

  request = function(className, args) {
    contract = contractDB[className];
    return TestContract(contract, className, args);
  };

  Test = {
    request: request
  };

  module.exports = Test;

}).call(this);
