/*globals describe, it*/
let CodeGenerator = require('../lib/contracts/code_generator.js');
let assert = require('assert');

function replaceCRLF(string) {
  return string.replace(/\r\n/g, '\n');
}

// TODO: instead 'eval' the code with a fake web3 object
// and check the generate code interacts as expected
describe('embark.CodeGenerator', function() {
  this.timeout(0);

  describe('#generateContracts', function() {
    let contracts = [
      {
        className: 'SimpleStorage',
        abiDefinition: [{"constant":true,"inputs":[],"name":"storedData","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"x","type":"uint256"}],"name":"set","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"get","outputs":[{"name":"retVal","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[{"name":"initialValue","type":"uint256"}],"type":"constructor"}],
        gasEstimates: 12000,
        deployedAddress: "0x123",
        code: '12345'
      },
      {
        className: 'Foo',
        abiDefinition: [{"constant":true,"inputs":[],"name":"storedData","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"x","type":"uint256"}],"name":"set","outputs":[],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"get","outputs":[{"name":"retVal","type":"uint256"}],"payable":false,"type":"function"},{"inputs":[{"name":"initialValue","type":"uint256"}],"type":"constructor"}],
        gasEstimates: 12000,
        deployedAddress: "0x124",
        code: '123456'
      }
    ]

    let generator = new CodeGenerator({blockchainConfig: {}});

    describe('with EmbarkJS', function() {
      let withEmbarkJS = true;

      it('should generate contract code', function() {
        var contractCode = "\n__mainContext.__loadManagerInstance.execWhenReady(function() {\n  __mainContext.SimpleStorage = new EmbarkJS.Contract({abi: [{\"constant\":true,\"inputs\":[],\"name\":\"storedData\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"x\",\"type\":\"uint256\"}],\"name\":\"set\",\"outputs\":[],\"payable\":false,\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"get\",\"outputs\":[{\"name\":\"retVal\",\"type\":\"uint256\"}],\"payable\":false,\"type\":\"function\"},{\"inputs\":[{\"name\":\"initialValue\",\"type\":\"uint256\"}],\"type\":\"constructor\"}], address: '0x123', code: '12345', gasEstimates: 12000});\n\n});\n__mainContext.__loadManagerInstance.execWhenReady(function() {\n  __mainContext.Foo = new EmbarkJS.Contract({abi: [{\"constant\":true,\"inputs\":[],\"name\":\"storedData\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"x\",\"type\":\"uint256\"}],\"name\":\"set\",\"outputs\":[],\"payable\":false,\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"get\",\"outputs\":[{\"name\":\"retVal\",\"type\":\"uint256\"}],\"payable\":false,\"type\":\"function\"},{\"inputs\":[{\"name\":\"initialValue\",\"type\":\"uint256\"}],\"type\":\"constructor\"}], address: '0x124', code: '123456', gasEstimates: 12000});\n\n});\n";
        assert.strictEqual(replaceCRLF(generator.generateContracts(contracts, withEmbarkJS)), contractCode);
      });
    });

    describe('with default interface', function() {
      let withEmbarkJS = false;

      it('should generate contract code', function() {
        var contractCode = "\n__mainContext.__loadManagerInstance.execWhenReady(function() {\n  SimpleStorageAbi = [{\"constant\":true,\"inputs\":[],\"name\":\"storedData\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"x\",\"type\":\"uint256\"}],\"name\":\"set\",\"outputs\":[],\"payable\":false,\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"get\",\"outputs\":[{\"name\":\"retVal\",\"type\":\"uint256\"}],\"payable\":false,\"type\":\"function\"},{\"inputs\":[{\"name\":\"initialValue\",\"type\":\"uint256\"}],\"type\":\"constructor\"}];\nSimpleStorage = new web3.eth.Contract(SimpleStorageAbi);\nSimpleStorage.options.address = '0x123';\nSimpleStorage.address = '0x123';\nSimpleStorage.options.from = web3.eth.defaultAccount;\n\n\n});\n__mainContext.__loadManagerInstance.execWhenReady(function() {\n  FooAbi = [{\"constant\":true,\"inputs\":[],\"name\":\"storedData\",\"outputs\":[{\"name\":\"\",\"type\":\"uint256\"}],\"payable\":false,\"type\":\"function\"},{\"constant\":false,\"inputs\":[{\"name\":\"x\",\"type\":\"uint256\"}],\"name\":\"set\",\"outputs\":[],\"payable\":false,\"type\":\"function\"},{\"constant\":true,\"inputs\":[],\"name\":\"get\",\"outputs\":[{\"name\":\"retVal\",\"type\":\"uint256\"}],\"payable\":false,\"type\":\"function\"},{\"inputs\":[{\"name\":\"initialValue\",\"type\":\"uint256\"}],\"type\":\"constructor\"}];\nFoo = new web3.eth.Contract(FooAbi);\nFoo.options.address = '0x124';\nFoo.address = '0x124';\nFoo.options.from = web3.eth.defaultAccount;\n\n\n});\n";
        assert.strictEqual(replaceCRLF(generator.generateContracts(contracts, withEmbarkJS)), contractCode);
      });
    });

  });

  //describe('#generateABI', function() {
  //});
});
