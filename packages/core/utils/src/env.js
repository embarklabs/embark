import {
  anchoredValue,
  joinPath,
  PWD,
  DAPP_PATH,
  DIAGRAM_PATH,
  EMBARK_PATH,
  PKG_PATH,
  NODE_PATH
} from './pathUtils';
import * as findUp from 'find-up';
import { delimiter } from 'path';

export function setUpEnv(defaultEmbarkPath) {
  const DEFAULT_PWD = process.cwd();
  anchoredValue(PWD, DEFAULT_PWD);

  const DEFAULT_DAPP_PATH = anchoredValue(PWD);
  anchoredValue(DAPP_PATH, DEFAULT_DAPP_PATH);

  const DEFAULT_DIAGRAM_PATH = joinPath(anchoredValue(DAPP_PATH), 'diagram.svg');
  anchoredValue(DIAGRAM_PATH, DEFAULT_DIAGRAM_PATH);

  const DEFAULT_EMBARK_PATH = defaultEmbarkPath;
  anchoredValue(EMBARK_PATH, DEFAULT_EMBARK_PATH);

  const DEFAULT_PKG_PATH = anchoredValue(PWD);
  anchoredValue(PKG_PATH, DEFAULT_PKG_PATH);

  const node_paths = process.env[NODE_PATH] ? process.env[NODE_PATH].split(delimiter) : [];

  const EMBARK_NODE_MODULES_PATHS = [];
  let len = 0;
  let start = anchoredValue(EMBARK_PATH);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const found = findUp.sync('node_modules', {cwd: start});
    if (!found) break;
    start = joinPath(start, '..');
    if ((EMBARK_NODE_MODULES_PATHS[len - 1] !== found) &&
        !node_paths.includes(found)) {
      len = EMBARK_NODE_MODULES_PATHS.push(found);
    }
  }

  // NOTE: setting NODE_PATH at runtime won't effect lookup behavior in the
  // current process, but will take effect in child processes
  process.env[NODE_PATH] = EMBARK_NODE_MODULES_PATHS.join(delimiter) +
    (process.env[NODE_PATH] ? delimiter : '') +
    (process.env[NODE_PATH] || '');
}

export function isDebug() {
  const argvString= process.execArgv.join();
  return argvString.includes('--debug') || argvString.includes('--inspect');
}
