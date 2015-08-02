var python = require('python').shell;
var mm = require('methodmissing');
var sync = require('sync-me');

py_exec = function(cmd) {
  return sync(python, cmd)[1].trim();
};

TestContractWrapper = (function() {
  function TestContractWrapper(contract, className, args) {
    this.contract = contract.compiled;
    this.className = className;
    this.args = args;
    this.initializeContract();
  }

  TestContractWrapper.prototype.initializeContract = function() {
    example_abi = JSON.stringify(this.contract.info.abiDefinition);
    example_binary = this.contract.code.slice(2);

    py_exec("example_abi = '" + example_abi + "'");
    py_exec("example_abi");
    py_exec("example_binary = '" + example_binary + "'.decode('hex')");
    py_exec("example_binary");

    if (this.args === undefined) {
      py_exec(this.className + "_contract = EvmContract(example_abi, example_binary, '" + this.className + "')");
    }
    else {
      py_exec(this.className + "_contract = EvmContract(example_abi, example_binary, '" + this.className + "', [" + this.args.join(",") + "])");
    }

    this.contractVariable = this.className + "_contract";
  };

  TestContractWrapper.prototype.execCmd = function(method, args) {
    var arg_list = [];
    for (var key in args) {
      var value = args[key];
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

test = function(contractsConfig, contractFiles) {
  contractsConfig.init(contractFiles, 'development');

  contractsConfig.compileContracts();
  this.contractDB = contractsConfig.contractDB;
}

test.prototype.request = function(className, args) {
  var contract = this.contractDB[className];
  py_exec("from ethertdd import EvmContract");
  return TestContract(contract, className, args);
}

module.exports = test;

