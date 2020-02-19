import chalk from 'chalk';
import cloneDeep from 'lodash.clonedeep';
import isPlainObject from 'lodash.isplainobject';

import { creatorDefaults } from './defaults';

const ALL_TOKENS_REGEX = /\{\{([^}]+)\}\}/g;
const BARE_TOKEN_REGEX = /\{\{\s*(\S+)\s*\}\}/;

const cyan = (str) => chalk.cyan(str);
const log = (mark, str, which = 'log') => console[which](
  mark, str.filter(s => !!s).join(` `)
);
export const logError = (...str) => log(chalk.red(`✘`), str, 'error');
export const logInfo = (...str) => log(chalk.blue(`ℹ`), str);
export const logSuccess = (...str) => log(chalk.green(`✔`), str);
export const logWarning = (...str) => log(chalk.yellow('‼︎'), str);

export function makeCreatorCommanderOptions(creator) {
  return makeInitCommanderOptions({
    options: {
      ...creator.init.options,
      ...creator.options
    }
  });
}

export function makeInitCommanderOptions({options}) {
  return Object.values(options)
    .sort(({long: aLong}, {long: bLong}) => {
      if (aLong < bLong) return -1;
      if (aLong > bLong) return 1;
      return 0;
    })
    .reduce((acc, {default: def, description, long, short}) => {
      const copt = [];
      if (short) {
        copt.push(`-${short}, --${long}`);
      } else {
        copt.push(`--${long}`);
      }
      copt.push(description);
      if (def) copt.push(def);
      return acc.concat([copt]);
    }, []);
}

export function replaceTokens(obj) {
  obj = cloneDeep(obj);
  let dict = {};

  let entries = Object.entries(obj).map(
    ([key, value]) => [key, value, '', 'object']
  );
  while (entries.length) {
    let [key, value, level, kind] = entries.shift();
    let nextLevel;
    if (kind === 'object') {
      nextLevel = `${level}${level ? '.' : ''}${key}`;
    } else if (kind === 'array') {
      nextLevel = `${level}[${key}]`;
    }
    if (isPlainObject(value)) {
      const nextKind = 'object';
      entries.unshift(...(Object.entries(value).map(
        ([key, value]) => [key, value, nextLevel, nextKind]
      )));
      continue;
    } else if (Array.isArray(value)) {
      const nextKind = 'array';
      entries.unshift(...(value.map(
        (value, index) => [index, value, nextLevel, nextKind]
      )));
      continue;
    } else if (typeof value !== 'string') {
      value = value.toString();
    }
    const token = nextLevel;
    dict[token] = value;
  }

  const keys = Object.keys(dict);
  const dependencies = {};
  while (keys.length) {
    const key = keys.shift();
    if (!dependencies[key]) dependencies[key] = new Set();
    let unresolvedDep;
    const matches = dict[key].match(ALL_TOKENS_REGEX);
    if (matches) {
      matches
        .map(curly => curly.match(BARE_TOKEN_REGEX)[1])
        .forEach(token => {
          if (!dict.hasOwnProperty(token)) {
            throw new Error(`Unknown token ${token}`);
          }
          dependencies[key].add(token);
        });
      [...dependencies[key]].forEach(dependency => {
        if (dependencies[dependency]?.has(key)) {
          throw new Error(
            `circular dependency between tokens ${key} and ${dependency}`
          );
        }
        if (dict[dependency].match(ALL_TOKENS_REGEX)) {
          if (!unresolvedDep) {
            unresolvedDep = true;
            keys.push(key);
          }
        } else {
          dict[key] = replaceTokenInString(
            dict[key],
            dependency,
            dict[dependency]
          );
        }
      });
    }
  }

  entries = Object.entries(obj).map(([key, value]) => [key, value, obj]);
  while (entries.length) {
    let [key, value, context] = entries.shift();
    const nextContext = value;
    if (isPlainObject(value)) {
      entries.unshift(...(Object.entries(value).map(
        ([key, value]) => [key, value, nextContext]
      )));
      continue;
    } else if (Array.isArray(value)) {
      entries.unshift(...(value.map(
        (value, index) => [index, value, nextContext]
      )));
      continue;
    } else if (typeof value === 'string') {
      const matches = value.match(ALL_TOKENS_REGEX);
      if (matches) {
        matches
          .map(curly => curly.match(BARE_TOKEN_REGEX)[1])
          .forEach(token => {
            context[key] = replaceTokenInString(
              value,
              token,
              dict[token]
            );
          });
      }
    }
  }

  return obj;
}

function replaceTokenInString(string, token, value) {
  return string.replace(
    new RegExp(`\\{\\{(\\s?)+${token}(\\s?)+\\}\\}`, 'g'),
    value
  );
}

// !!! needs refactor because intend to use spawn
export function runCommand(cmd, inherit = true, display) {
  logInfo(`Running command ${cyan(display || cmd)}.`);
  let out;
  if (inherit) {
    // execSyncInherit(cmd);
  } else {
    // out = execSync(cmd);
  }
  return out;
}
