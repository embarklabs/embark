import Convert from 'ansi-to-html';
import qs from 'qs';

import {DARK_THEME, BALANCE_REGEX} from '../constants';

import {toWei} from 'web3-utils';
import BigNumber from 'bignumber.js';

export function last(array) {
  return array && array.length ? array[array.length - 1] : undefined;
}
/* eslint no-bitwise: "off" */
export function hashCode(str) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

export function ansiToHtml(text) {
  const convert = new Convert();
  return convert.toHtml(text.replace(/\n/g,'<br>'));
}

export function getQueryParam(location, param) {
  return qs.parse(location.search, {ignoreQueryPrefix: true})[param];
}

export function getQueryToken(location) {
  return getQueryParam(location, 'token');
}

export function getDebuggerTransactionHash(location) {
  return qs.parse(location.search, {ignoreQueryPrefix: true}).debuggerTransactionHash;
}

export function stripQueryToken(location) {
  return stripQueryParam(location, 'token');
}

export function stripQueryParam(location, param) {
  const _location = Object.assign({}, location);
  _location.search = _location.search.replace(
    new RegExp(`(\\?|&?)(${param}=[\\w-]*)(&?)`),
    (_, p1, p2, p3) => (p2 ? (p3 === '&' ? p1 : '') : '')
  );
  return _location;
}

export const isDarkTheme = (theme) => theme === DARK_THEME;

export function getWeiBalanceFromString(balanceString) {
  if (!balanceString) {
    return 0;
  }
  const match = balanceString.match(BALANCE_REGEX);
  if (!match) {
    throw new Error(`Unrecognized balance string "${balanceString}"`);
  }
  // if no units passed in, assume we are dealing with wei
  if (!match[2]) {
    return new BigNumber(match[1]).toString(10);
  }

  return toWei(match[1], match[2]);
}
