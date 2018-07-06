/*globals describe, it*/
const assert = require('assert');
const TemplateGenerator = require('../lib/cmds/template_generator');

describe('TemplateGenerator', function () {
  describe('getExternalProject', function () {
    let templateGenerator;

    before(() => {
      templateGenerator = new TemplateGenerator();
    });

    describe('with github link', function () {

      it('return correct zip filename for https link', function (done) {
        let result = templateGenerator.getExternalProject("https://github.com/embark-framework/embark");
        assert.deepEqual(result.url, "https://github.com/embark-framework/embark/archive/master.zip");
        assert.deepEqual(result.filePath, ".embark/templates/embark-framework/embark/archive.zip");
        done();
      });

      it('return correct zip filename for http link', function (done) {
        let result = templateGenerator.getExternalProject("http://github.com/embark-framework/embark");
        assert.deepEqual(result.url, "http://github.com/embark-framework/embark/archive/master.zip");
        assert.deepEqual(result.filePath, ".embark/templates/embark-framework/embark/archive.zip");
        done();
      });

      it('return correct zip filename without protocol specified ', function (done) {
        let result = templateGenerator.getExternalProject("github.com/embark-framework/embark");
        assert.deepEqual(result.url, "https://github.com/embark-framework/embark/archive/master.zip");
        assert.deepEqual(result.filePath, ".embark/templates/embark-framework/embark/archive.zip");
        done();
      });

      it('return correct zip filename without protocol specified ', function (done) {
        let result = templateGenerator.getExternalProject("github.com/embark-framework/embark");
        assert.deepEqual(result.url, "https://github.com/embark-framework/embark/archive/master.zip");
        assert.deepEqual(result.filePath, ".embark/templates/embark-framework/embark/archive.zip");
        done();
      });

      it('return correct zip filename with just username/repo specified', function (done) {
        let result = templateGenerator.getExternalProject("embark-framework/embark");
        assert.deepEqual(result.url, "https://github.com/embark-framework/embark/archive/master.zip");
        assert.deepEqual(result.filePath, ".embark/templates/embark-framework/embark/archive.zip");
        done();
      });

      it('return correct zip filename with just embark template specified', function (done) {
        let result = templateGenerator.getExternalProject("react");
        assert.deepEqual(result.url, "https://github.com/embark-framework/embark-react-template/archive/master.zip");
        assert.deepEqual(result.filePath, ".embark/templates/embark-framework/embark-react-template/archive.zip");
        done();
      });

    });

  });
});

