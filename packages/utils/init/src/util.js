import chalk from 'chalk';
import cloneDeep from 'lodash.clonedeep';
import isPlainObject from 'lodash.isplainobject';

import { creatorDefaults } from './defaults';

const cyan = (str) => chalk.cyan(str);
const log = (mark, str, which = 'log') => console[which](
  mark, str.filter(s => !!s).join(` `)
);
export const logError = (...str) => log(chalk.red(`✘`), str, 'error');
export const logInfo = (...str) => log(chalk.blue(`ℹ`), str);
export const logSuccess = (...str) => log(chalk.green(`✔`), str);
export const logWarning = (...str) => log(chalk.yellow('‼︎'), str);

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

export function makeCreatorCommanderOptions(creator) {
  return makeInitCommanderOptions({
    options: {
      ...creator.init.options,
      ...creator.options
    }
  });
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

// NOTE: does not detect/handle recursive references, e.g. `{{foo}}` refers to
// `{{bar}}` and `{{bar}}` refers to `{{foo}}`, but assume for now that won't
// be a common pitfall
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
    if (typeof value === 'number') value = value.toString();
    if (typeof value !== 'string') {
      if (isPlainObject(value)) {
        const nextKind = 'object';
        entries.unshift(...(Object.entries(value).map(
          ([key, value]) => [key, value, nextLevel, nextKind]
        )));
      } else if (Array.isArray(value)) {
        const nextKind = 'array';
        entries.unshift(...(value.map(
          (value, index) => [index, value, nextLevel, nextKind]
        )));
      }
      continue;
    }
    const token = nextLevel;
    dict[token] = value;
  }

  const unknowns = [];
  Object.values(dict).forEach(value => {
    const matches = value.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return;
    unknowns.push(...matches.map(
      curly => curly.match(/\{\{\s*(\S+)\s*\}\}/)[1]
    ).filter(
      token => !dict.hasOwnProperty(token)
    ));
  });

  if (unknowns.length) {
    throw new Error(
      `Unknown token${unknowns.length > 1 ? 's' : ''} ${unknowns.join(', ')}`
    );
  }

  const keys = Object.keys(dict);
  const dependencies = {};
  const dependents = {};
  while (keys.length) {
    const key = keys.shift();
    if (!dependencies[key]) dependencies[key] = new Set();
    if (!dependents[key]) dependents[key] = new Set();
    let unresolvedDep;
    const matches = dict[key].match(/\{\{([^}]+)\}\}/g);
    if (matches) {
      matches
        .map(curly => curly.match(/\{\{\s*(\S+)\s*\}\}/)[1])
        .forEach(token => {
          if (!dependents[token]) dependents[token] = new Set();
          dependents[token].add(key);
          dependencies[key].add(token);
        });
      [...dependencies[key]].forEach(dependency => {
        if (dependents[dependency] && dependents[dependency].has(key)) {
          throw new Error(
            `circular dependency between tokens ${key} and ${dependency}`
          );
        }
        if (dict[dependency].match(/\{\{([^}]+)\}\}/g)) {
          if (!unresolvedDep) {
            unresolvedDep = true;
            keys.push(key);
          }
        } else {
          const token = `{{${dependency}}}`;
          let value = dict[key];
          let replaced;
          while (true) {
            replaced = value.replace(token, dict[dependency]);
            if (replaced === value) break;
            value = replaced;
          }
          dict[key] = value;
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
      Object.entries(dict).forEach(([token, tokenVal]) => {
        token = `{{${token}}}`;
        let replaced;
        while (true) {
          replaced = value.replace(token, tokenVal);
          if (replaced === value) break;
          value = replaced;
        }
        context[key] = value;
      });
    }
  }

  return obj;
}
