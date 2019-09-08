const assert = require('assert').strict;
const refute = require('refute')(assert);
const sinon = require('sinon');

const MochaTestRunner = require('../lib');

const validFiles = [
  'SOME_UPPERCASE_TEST.js',
  'other_uppercase_test.JS',
  'some_test_file.js',
  'c:\test\file.js'
];

const invalidFiles = [
  'jsschool.com',
  'other_uppercase_test.js.map'
];

describe('Mocha Test Runner', () => {
  let embark;

  beforeEach(() => {
    const events = { request: sinon.spy() };
    embark = { events: events };
  });

  describe('methods', () => {
    let instance;

    beforeEach(() => { instance = new MochaTestRunner(embark, {}); });

    describe('match', () => {
      it('matches .js files', () => {
        validFiles.forEach(f => {
          assert(instance.match(f), `didn't match ${f} when it should`);
        });
      });

      it('does not match non .js files', () => {
        invalidFiles.forEach(f => {
          refute(instance.match(f), `matched ${f} when it shouldn't`);
        });
      });
    });
  });
});
