var python = require('python').shell;
var web3 = require('web3');
var fs = require('fs');
var mm = require('methodmissing');
var sync = require('sync-me');
var grunt = require('grunt');

py_exec = function(cmd) {
  return sync(python, cmd)[1].trim();
}

TestContractWrapper = (function() {
  function TestContractWrapper(contract, className, args) {
    this.contract = contract;
    this.className = className;
    this.args = args;
    this.initializeContract();
  }

  TestContractWrapper.prototype.initializeContract = function() {
    example_abi = JSON.stringify(contract.info.abiDefinition)
    example_binary = contract.code.slice(2)

    py_exec("example_abi = '" + example_abi + "'")
    py_exec("example_abi")
    py_exec("example_binary = '" + example_binary + "'.decode('hex')")
    py_exec("example_binary")

    if (this.args == undefined) {
      py_exec(this.className + "_contract = EvmContract(example_abi, example_binary, '" + this.className + "')")
    }
    else {
      py_exec(this.className + "_contract = EvmContract(example_abi, example_binary, '" + this.className + "', [" + this.args.join(",") + "])")
    }

    this.contractVariable = this.className + "_contract"
  };

  TestContractWrapper.prototype.execCmd = function(method, args) {
    arg_list = [];
    for (key in args) {
      value = args[key];
      arg_list.push(value);
    }

    data = py_exec(this.className + "_contract." + method + "(" + arg_list.join(",") + ")");
    return data;
  };

  return TestContractWrapper;

})();

TestContract = function(contract, className, args) {
  var wrapper = new TestContractWrapper(contract, className, args);
  var Obj = mm(wrapper, function (key, args) {
    return wrapper.execCmd(key, args);
  });
  return Obj;
}

request = function(className, args) {
  py_exec("from ethertdd import EvmContract")

  web3.setProvider(new web3.providers.HttpProvider('http://localhost:8101'));
  web3.eth.defaultAccount = web3.eth.accounts[0];

  //TODO: get the files from the config
  contractFiles = grunt.file.expand("./app/contracts/**/*.sol")
  contractDB = {}

  var i;
  for (i = 0, len = contractFiles.length; i < len; i++) {
    var contractFile = contractFiles[i];
    var source = fs.readFileSync(contractFile).toString()

    compiled_contracts = web3.eth.compile.solidity(source)
    for (className in compiled_contracts) {
      var contract = compiled_contracts[className];
      contractDB[className] = contract;
    }
  }

  var contract = contractDB[className];
  return TestContract(contract, className, args)
}

Test = {
  request: request
}

module.exports = Test;

