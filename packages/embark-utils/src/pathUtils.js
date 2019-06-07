import * as path from 'path';
import * as os from 'os';
import { sha512 } from './web3Utils';

export const PWD = 'PWD';
export const DAPP_PATH = 'DAPP_PATH';
export const DIAGRAM_PATH = 'DIAGRAM_PATH';
export const EMBARK_PATH = 'EMBARK_PATH';
export const PKG_PATH = 'PKG_PATH';
export const NODE_PATH = 'NODE_PATH';

export function anchoredValue(anchor, value) {
  if (!arguments.length) {
    throw new TypeError(`anchor name '${anchor}' was not specified`);
  }
  if (arguments.length > 2) {
    throw new TypeError(`accepts at most 2 arguments`);
  }
  if (typeof anchor !== 'string') {
    throw new TypeError(`anchor name '${anchor}' was not a string`);
  }
  let _anchor = process.env[anchor];
  if (arguments.length < 2 && !_anchor) {
    throw new Error(`process.env.${anchor} was not set`);
  }
  // don't override an existing value, e.g. if already set by bin/embark
  if (!_anchor) {
    _anchor = value;
    process.env[anchor] = _anchor;
  }
  return _anchor;
}

export function anchoredPath(anchor, ...args) {
  return joinPath(
    anchoredValue(anchor),
    ...args.map(path => path.replace(dappPath(), ''))
  );
}

export function joinPath() {
  return path.join.apply(path.join, arguments);
}

export function tmpDir(...args) { return joinPath(os.tmpdir(), ...args); }
export function diagramPath(...args) { return anchoredPath(DIAGRAM_PATH, ...args); }
export function pkgPath(...args) { return anchoredPath(PKG_PATH, ...args); }
export function dappPath(...args) { return anchoredPath(DAPP_PATH, ...args); }
export function embarkPath(...args) { return anchoredPath(EMBARK_PATH, ...args); }

export function ipcPath(basename, usePipePathOnWindows = false) {
  if (!(basename && typeof basename === 'string')) {
    throw new TypeError('first argument must be a non-empty string');
  }
  if (process.platform === 'win32' && usePipePathOnWindows) {
    return `\\\\.\\pipe\\${basename}`;
  }
  return joinPath(
    tmpDir(`embark-${sha512(dappPath()).slice(0, 8)}`),
    basename
  );
}

export function urlJoin(url, path) {
  let urlChunks = url.split('/');
  let levels = path.split('../');

  // remove relative path parts from end of url
  urlChunks = urlChunks.slice(0, urlChunks.length - levels.length);

  // remove relative path parts from start of match
  levels.splice(0, levels.length - 1);

  // add on our match so we can join later
  urlChunks = urlChunks.concat(levels.join().replace('./', ''));

  return urlChunks.join('/');
}

export function toForwardSlashes(content) {
  return content.replace(/\\/g, '/');
}

export function normalizePath(content, useForwardSlashes = true) {
  content = path.normalize(content);
  if (useForwardSlashes && path.sep !== '/') {
    content = toForwardSlashes(content);
  }
  return content;
}
