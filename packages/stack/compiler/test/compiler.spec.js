import sinon from 'sinon';
import assert from 'assert';
import { File, Types } from 'embark-utils';
import { fakeEmbark } from 'embark-testing';
import Compiler from '../src/';

const { embark, plugins } = fakeEmbark();

/* eslint jest/expect-expect: ["error", { "assertFunctionNames": ["assert", "expect"] }] */

// Due to our `DAPP_PATH` dependency in `embark-utils` `dappPath()`, we need to
// ensure that this environment variable is defined.
process.env.DAPP_PATH = 'something';

describe('stack/compiler', () => {

  // eslint-disable-next-line no-unused-vars
  let compiler;

  beforeEach(() => {
    compiler = new Compiler(embark, { plugins });
  });

  afterEach(() => {
    embark.teardown();
    sinon.restore();
  });

  test('it should use registered compiler', () => {
    const fooCompiler = sinon.spy((files, options, cb) => cb(null, {
      contractA: 'someResultA',
      contractB: 'someResultB',
      contractC: 'someResultC'
    }));

    embark.plugins.createPlugin('fooCompiler').registerCompiler('.foo', fooCompiler);

    return new Promise(done => {
      embark.events.request('compiler:contracts:compile', [
        new File({filename: 'foo.foo', type: Types.dappFile, path: 'foo.foo'}),
        new File({filename: 'foo2.foo', type: Types.dappFile, path: 'foo2.foo'}),
        new File({filename: 'foo3.foo', type: Types.dappFile, path: 'foo3.foo'})
      ], () => {
        assert(fooCompiler.called);
        done();
      });
    });
  });

  test('it should iterate over available compilers to find a match for a given source file', () => {
    const fooCompiler = sinon.spy((files, options, cb) => cb(null, { fooContract: 'foo' }));
    const barCompiler = sinon.spy((files, options, cb) => cb(null, { barContract: 'bar' }));

    embark.plugins.createPlugin('fooCompiler').registerCompiler('.foo', fooCompiler);
    embark.plugins.createPlugin('barCompiler').registerCompiler('.bar', barCompiler);

    return new Promise(done => {
      embark.events.request('compiler:contracts:compile', [new File({filename: 'foo.bar', type: Types.dappFile, path: 'foo.bar'})], () => {
        assert(fooCompiler.notCalled);
        assert(barCompiler.called);
        done();
      });
    });
  });

  test('it should not compile source files if there is no matching compiler', () => {
    const fooCompiler = sinon.spy((files, options, cb) => cb(null, { fooContract: 'foo' }));
    embark.plugins.createPlugin('fooCompiler').registerCompiler('.foo', fooCompiler);

    const files = [new File({filename: 'foo.bar', type: Types.dappFile, path: 'foo.bar'})];

    return new Promise(done => {
      embark.events.request('compiler:contracts:compile', files, () => {
        files.forEach(file => assert(!file.compiled));
        done();
      });
    });
  });
});
