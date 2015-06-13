var python = require('python').shell;
var web3 = require('web3');
var fs = require('fs');
var mm = require('methodmissing');
var sync = require('sync-me');

py_exec = function(cmd) {
  console.log("python: " + cmd);
  return sync(python, cmd)[1];
}

py_exec("from ethertdd import EvmContract")

web3.setProvider(new web3.providers.HttpProvider('http://localhost:8101'));
web3.eth.defaultAccount = web3.eth.accounts[0];

TestContractWrapper = (function() {
  function TestContractWrapper(contract, className) {
    this.contract = contract;
    this.className = className;
    this.initializeContract();
  }

  TestContractWrapper.prototype.initializeContract = function() {
    example_abi = JSON.stringify(contract.info.abiDefinition)
    example_binary = contract.code.slice(2)

    py_exec("example_abi = '" + example_abi + "'")
    py_exec("example_abi")
    py_exec("example_binary = '" + example_binary + "'.decode('hex')")
    py_exec("example_binary")
    py_exec(this.className + "_contract = EvmContract(example_abi, example_binary)")

    this.contractVariable = this.className + "_contract"
  };

  TestContractWrapper.prototype.execCmd = function(method, args) {
    arg_list = [];
    for (key in args) {
      value = args[key];
      arg_list.push(value);
    }

    data = py_exec(this.className + "_contract." + method + "(" + arg_list.join(",") + ")");
    console.log("res: " + data);
    return data;
  };

  return TestContractWrapper;

})();

TestContract = function(contract, className) {
  var wrapper = new TestContractWrapper(contract, className);
  var Obj = mm(wrapper, function (key, args) {
    return wrapper.execCmd(key, args);
  });
  return Obj;
}

request = function(className) {
  filename = './app/contracts/simple_storage.sol'
  source = fs.readFileSync(filename).toString()

  compiled_contracts = web3.eth.compile.solidity(source)
  contract = compiled_contracts[className]
  return TestContract(contract, className)
}

Test = {
  request: request
}

module.exports = Test;

