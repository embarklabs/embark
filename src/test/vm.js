/*globals describe, it*/
const TestLogger = require('../lib/utils/test_logger');
const VM = require('../lib/core/modules/coderunner/vm');
const {expect} = require('chai');

describe('embark.vm', function () {
  const testObj = {
    shouldReturnEmbark: 'embark',
    shouldReturnEmbarkAwait: async () => {return new Promise(resolve => resolve('embark'));}
  };
  const vm = new VM({sandbox: {testObj}}, new TestLogger({}));

  describe('#evaluateCode', function () {
    it('should be able to evaluate basic code', function (done) {
      vm.doEval('1 + 1', false, (err, result) => {
        expect(err).to.be.null;
        expect(result).to.be.equal(2);
        done();
      });
    });
    it('should be able to access the members of the sandbox', function (done) {
      vm.doEval('testObj.shouldReturnEmbark', false, (err, result) => {
        expect(err).to.be.null;
        expect(result).to.be.equal('embark');
        done();
      });
    });
    it('should be able to evaluate async code using await', function (done) {
      vm.doEval('await testObj.shouldReturnEmbarkAwait()', false, (err, result) => {
        expect(err).to.be.null;
        expect(result).to.be.equal('embark');
        done();
      });
    });
  });
});
