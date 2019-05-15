import * as path from 'path';
import {joinPath, sha512, tmpDir} from 'embark-utils';

export function dappPath(...names) {
  const DAPP_PATH = process.env.DAPP_PATH || process.cwd();
  return path.join(DAPP_PATH, ...names);
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
