/*globals describe, it*/
const assert = require('assert');
const TemplateGenerator = require('../lib/utils/template_generator');

describe('TemplateGenerator', function () {
  describe('getExternalProject', function () {
    let templateGenerator;

    before(() => {
      templateGenerator = new TemplateGenerator();
    });

    describe('with github link', function () {

      it('return correct zip filename for https link', function () {
        let result = templateGenerator.getExternalProject("https://github.com/embark-framework/embark");
        assert.strictEqual(result.url, "https://github.com/embark-framework/embark/archive/master.zip");
        assert.strictEqual(result.filePath.replace(/\\/g,'/'), ".embark/templates/embark-framework/embark/master/archive.zip");
      });

      it('return correct zip filename for https link with branch specified', function () {
        let result = templateGenerator.getExternalProject("https://github.com/embark-framework/embark/tree/develop");
        assert.strictEqual(result.url, "https://github.com/embark-framework/embark/archive/develop.zip");
        assert.strictEqual(result.filePath.replace(/\\/g,'/'), ".embark/templates/embark-framework/embark/develop/archive.zip");
      });

      it('return correct zip filename for http link', function () {
        let result = templateGenerator.getExternalProject("http://github.com/embark-framework/embark");
        assert.strictEqual(result.url, "https://github.com/embark-framework/embark/archive/master.zip");
        assert.strictEqual(result.filePath.replace(/\\/g,'/'), ".embark/templates/embark-framework/embark/master/archive.zip");
      });

      it('return correct zip filename for http link with branch specified', function () {
        let result = templateGenerator.getExternalProject("http://github.com/embark-framework/embark/tree/develop");
        assert.strictEqual(result.url, "https://github.com/embark-framework/embark/archive/develop.zip");
        assert.strictEqual(result.filePath.replace(/\\/g,'/'), ".embark/templates/embark-framework/embark/develop/archive.zip");
      });

      it('return correct zip filename without protocol specified ', function () {
        let result = templateGenerator.getExternalProject("github.com/embark-framework/embark");
        assert.strictEqual(result.url, "https://github.com/embark-framework/embark/archive/master.zip");
        assert.strictEqual(result.filePath.replace(/\\/g,'/'), ".embark/templates/embark-framework/embark/master/archive.zip");
      });

      it('return correct zip filename without protocol with branch specified', function () {
        let result = templateGenerator.getExternalProject("github.com/embark-framework/embark#develop");
        assert.strictEqual(result.url, "https://github.com/embark-framework/embark/archive/develop.zip");
        assert.strictEqual(result.filePath.replace(/\\/g,'/'), ".embark/templates/embark-framework/embark/develop/archive.zip");
      });

      it('return correct zip filename with just username/repo specified', function () {
        let result = templateGenerator.getExternalProject("embark-framework/embark");
        assert.strictEqual(result.url, "https://github.com/embark-framework/embark/archive/master.zip");
        assert.strictEqual(result.filePath.replace(/\\/g,'/'), ".embark/templates/embark-framework/embark/master/archive.zip");
      });

      it('return correct zip filename with just username/repo and branch specified', function () {
        let result = templateGenerator.getExternalProject("embark-framework/embark#develop");
        assert.strictEqual(result.url, "https://github.com/embark-framework/embark/archive/develop.zip");
        assert.strictEqual(result.filePath.replace(/\\/g,'/'), ".embark/templates/embark-framework/embark/develop/archive.zip");
      });

      it('return correct zip filename with just embark template specified', function () {
        let result = templateGenerator.getExternalProject("react");
        assert.strictEqual(result.url, "https://github.com/embark-framework/embark-react-template/archive/master.zip");
        assert.strictEqual(result.filePath.replace(/\\/g,'/'), ".embark/templates/embark-framework/embark-react-template/archive.zip");
      });
    });

  });
});

