import Convert from 'ansi-to-html';
import qs from 'qs';

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

export function getQueryToken(location) {
  return qs.parse(location.search, {ignoreQueryPrefix: true}).token;
}

export function getDebuggerTransactionHash(location) {
  return qs.parse(location.search, {ignoreQueryPrefix: true}).debuggerTransactionHash;
}

export function stripQueryToken(location) {
  const _location = Object.assign({}, location);
  _location.search = _location.search.replace(
    /(\?|&?)(token=[\w-]*)(&?)/,
    (_, p1, p2, p3) => (p2 ? (p3 === '&' ? p1 : '') : '')
  );
  return _location;
}
