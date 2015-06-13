var python = require('python').shell;
var web3 = require('web3');
var fs = require('fs');
var mm = require('methodmissing');

py_exec = function(cmd) {
  python(cmd, function() {});
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
    py_exec(className + "_contract = EvmContract(example_abi, example_binary)")

    this.contractVariable = className + "_contract"
  };

  TestContractWrapper.prototype.execCmd = function(method, args) {
    arg_list = [];
    for (key in args) {
      value = args[key];
      arg_list.push(value);
    }

    console.log(this.className + "_contract." + method + "(" + arg_list.join(",") + ")")
    python(this.className + "_contract." + method + "(" + arg_list.join(",") + ")", function(err, data) {
      console.log("res: " + data);
    })
  };

  return TestContractWrapper;

})();

TestContract = function(contract, className) {
  var wrapper = new TestContractWrapper(contract, className);
  var Obj = mm(wrapper, function (key, args) {
    wrapper.execCmd(key, args)
  });
  return Obj;
}

filename = './app/contracts/simple_storage.sol'
source = fs.readFileSync(filename).toString()
className = 'SimpleStorage'

compiled_contracts = web3.eth.compile.solidity(source)
contract = compiled_contracts[className]
SimpleStorage = TestContract(contract, className)

SimpleStorage.set(100);

a = SimpleStorage.get()
console.log(a)

