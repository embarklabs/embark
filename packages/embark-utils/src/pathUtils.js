import * as path from 'path';
import * as os from 'os';
import { sha512 } from './web3Utils';

export function joinPath() {
  return path.join.apply(path.join, arguments);
}

export function tmpDir(...args) { return joinPath(os.tmpdir(), ...args); }

export function dappPath(...names) {
  return path.join(process.env.DAPP_PATH || process.cwd(), ...names);
}

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

export function embarkPath(...names) {
  const EMBARK_PATH = process.env.EMBARK_PATH;
  if (!EMBARK_PATH) {
    throw new Error('environment variable EMBARK_PATH was not set');
  }
  return path.join(EMBARK_PATH, ...names);
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
