/* global describe it beforeEach afterEach */

import * as i18n from 'embark-i18n';
import { Plugins } from 'embark-core';

const {fakeEmbark} = require('embark-testing');
const assert = require('assert');
const sinon = require('sinon');
i18n.setOrDetectLocale('en');

describe('embark.plugins', function() {
  this.timeout(0);
  let plugins;
  const {embark} = fakeEmbark();
  embark.events.log = () => {};

  beforeEach(() => {
    plugins = new Plugins(embark);
  });

  afterEach(() => {
    embark.teardown();
  });

  describe('runActionsForEvent', () => {
    it('should run actions in order of priority', (done) => {
      let lastFunctionSetsMeToTrue = false;
      const getPluginsPropertyAndPluginNameStub = sinon.stub(plugins, 'getPluginsPropertyAndPluginName')
        .returns([
          [
            {
              action: (_params, cb) => {
                // This function should be called second
                lastFunctionSetsMeToTrue = true;
                cb();
              },
              options: {priority: 50}
            },
            'Action 2'
          ],
          [
            {
              action: (_params, cb) => {
                // If this is called first, setting to false doesn't matter
                lastFunctionSetsMeToTrue = false;
                cb();
              },
              options: {priority: 30}
            },
            'Action 1'
          ]
        ]);

      plugins.runActionsForEvent('bogusEvent', [], () => {
        assert.strictEqual(lastFunctionSetsMeToTrue, true, 'Functions not called in order');
        getPluginsPropertyAndPluginNameStub.restore();
        done();
      });
    });
  });
});
