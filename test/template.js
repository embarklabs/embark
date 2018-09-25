/*globals describe, it*/
const assert = require('assert');
const TemplateGenerator = require('../lib/utils/template_generator');

describe('TemplateGenerator', function () {
  describe('getExternalProject', function () {
    let templateGenerator;

    before(() => {
      templateGenerator = new TemplateGenerator();
    });

    describe('with named template', function () {

      it('returns correct info for named template', function () {
        let result = templateGenerator.getExternalProject("typescript");
        assert.strictEqual(result.url, "https://codeload.github.com/embark-framework/embark-typescript-template/tar.gz/master");
        assert.strictEqual(result.filePath.replace(/\\/g,'/'), ".embark/templates/embark-framework/embark-typescript-template/master/archive.zip");
        assert.strictEqual(result.browse, "https://github.com/embark-framework/embark-typescript-template");

        result = templateGenerator.getExternalProject("typescript#features/branch");
        assert.strictEqual(result.url, "https://codeload.github.com/embark-framework/embark-typescript-template/tar.gz/features%2Fbranch");
        assert.strictEqual(result.filePath.replace(/\\/g,'/'), ".embark/templates/embark-framework/embark-typescript-template/features/branch/archive.zip");
        assert.strictEqual(result.browse, "https://github.com/embark-framework/embark-typescript-template/tree/features/branch");
      });

    });

    describe('with git host URL', function () {

      it('returns correct info for GitHub URL', function () {
        let result = templateGenerator.getExternalProject("http://github.com/embark-framework/embark");
        assert.strictEqual(result.url, "https://codeload.github.com/embark-framework/embark/tar.gz/master");

        result = templateGenerator.getExternalProject("https://github.com/embark-framework/embark");
        assert.strictEqual(result.url, "https://codeload.github.com/embark-framework/embark/tar.gz/master");
        assert.strictEqual(result.filePath.replace(/\\/g,'/'), ".embark/templates/embark-framework/embark/master/archive.zip");
        assert.strictEqual(result.browse, "https://github.com/embark-framework/embark");

        result = templateGenerator.getExternalProject("https://github.com/embark-framework/embark#features/branch");
        assert.strictEqual(result.url, "https://codeload.github.com/embark-framework/embark/tar.gz/features%2Fbranch");
        assert.strictEqual(result.filePath.replace(/\\/g,'/'), ".embark/templates/embark-framework/embark/features/branch/archive.zip");
        assert.strictEqual(result.browse, "https://github.com/embark-framework/embark/tree/features/branch");
      });

      it('returns correct info for Bitbucket URL', function () {
        let result = templateGenerator.getExternalProject("https://bitbucket.org/embark-framework/embark");
        assert.strictEqual(result.url, "https://bitbucket.org/embark-framework/embark/get/master.tar.gz");
        assert.strictEqual(result.filePath.replace(/\\/g,'/'), ".embark/templates/embark-framework/embark/master/archive.zip");
        assert.strictEqual(result.browse, "https://bitbucket.org/embark-framework/embark");

        result = templateGenerator.getExternalProject("https://bitbucket.org/embark-framework/embark#features/branch");
        assert.strictEqual(result.url, "https://bitbucket.org/embark-framework/embark/get/features%2Fbranch.tar.gz");
        assert.strictEqual(result.filePath.replace(/\\/g,'/'), ".embark/templates/embark-framework/embark/features/branch/archive.zip");
        assert.strictEqual(result.browse, "https://bitbucket.org/embark-framework/embark/src/features/branch");
      });

      it('returns correct info for GitLab URL', function () {
        let result = templateGenerator.getExternalProject("https://gitlab.com/embark-framework/embark");
        assert.strictEqual(result.url, "https://gitlab.com/embark-framework/embark/repository/archive.tar.gz?ref=master");
        assert.strictEqual(result.filePath.replace(/\\/g,'/'), ".embark/templates/embark-framework/embark/master/archive.zip");
        assert.strictEqual(result.browse, "https://gitlab.com/embark-framework/embark");

        result = templateGenerator.getExternalProject("https://gitlab.com/embark-framework/embark#features/branch");
        assert.strictEqual(result.url, "https://gitlab.com/embark-framework/embark/repository/archive.tar.gz?ref=features%2Fbranch");
        assert.strictEqual(result.filePath.replace(/\\/g,'/'), ".embark/templates/embark-framework/embark/features/branch/archive.zip");
        assert.strictEqual(result.browse, "https://gitlab.com/embark-framework/embark/tree/features/branch");
      });

    });

    describe('with git host shortcut', function () {

      it('returns correct info for GitHub shortcut', function () {
        let result = templateGenerator.getExternalProject("github:embark-framework/embark");
        assert.strictEqual(result.url, "https://codeload.github.com/embark-framework/embark/tar.gz/master");

        result = templateGenerator.getExternalProject("embark-framework/embark");
        assert.strictEqual(result.url, "https://codeload.github.com/embark-framework/embark/tar.gz/master");
        assert.strictEqual(result.filePath.replace(/\\/g,'/'), ".embark/templates/embark-framework/embark/master/archive.zip");
        assert.strictEqual(result.browse, "https://github.com/embark-framework/embark");

        result = templateGenerator.getExternalProject("embark-framework/embark#features/branch");
        assert.strictEqual(result.url, "https://codeload.github.com/embark-framework/embark/tar.gz/features%2Fbranch");
        assert.strictEqual(result.filePath.replace(/\\/g,'/'), ".embark/templates/embark-framework/embark/features/branch/archive.zip");
        assert.strictEqual(result.browse, "https://github.com/embark-framework/embark/tree/features/branch");
      });

      it('returns correct info for Bitbucket shortcut', function () {
        let result = templateGenerator.getExternalProject("bitbucket:embark-framework/embark");
        assert.strictEqual(result.url, "https://bitbucket.org/embark-framework/embark/get/master.tar.gz");
        assert.strictEqual(result.filePath.replace(/\\/g,'/'), ".embark/templates/embark-framework/embark/master/archive.zip");
        assert.strictEqual(result.browse, "https://bitbucket.org/embark-framework/embark");

        result = templateGenerator.getExternalProject("bitbucket:embark-framework/embark#features/branch");
        assert.strictEqual(result.url, "https://bitbucket.org/embark-framework/embark/get/features%2Fbranch.tar.gz");
        assert.strictEqual(result.filePath.replace(/\\/g,'/'), ".embark/templates/embark-framework/embark/features/branch/archive.zip");
        assert.strictEqual(result.browse, "https://bitbucket.org/embark-framework/embark/src/features/branch");
      });

      it('returns correct info for GitLab shortcut', function () {
        let result = templateGenerator.getExternalProject("gitlab:embark-framework/embark");
        assert.strictEqual(result.url, "https://gitlab.com/embark-framework/embark/repository/archive.tar.gz?ref=master");
        assert.strictEqual(result.filePath.replace(/\\/g,'/'), ".embark/templates/embark-framework/embark/master/archive.zip");
        assert.strictEqual(result.browse, "https://gitlab.com/embark-framework/embark");

        result = templateGenerator.getExternalProject("gitlab:embark-framework/embark#features/branch");
        assert.strictEqual(result.url, "https://gitlab.com/embark-framework/embark/repository/archive.tar.gz?ref=features%2Fbranch");
        assert.strictEqual(result.filePath.replace(/\\/g,'/'), ".embark/templates/embark-framework/embark/features/branch/archive.zip");
        assert.strictEqual(result.browse, "https://gitlab.com/embark-framework/embark/tree/features/branch");
      });

    });

  });
});
