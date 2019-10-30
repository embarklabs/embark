const merge = require('merge');

export function last(array: any) {
  return array[array.length - 1];
}

export function recursiveMerge(...args: any[]) {
  return merge.recursive(...args);
}

export function compact(array: any) {
  return array.filter((n: any) => n);
}

export function groupBy(array: any, key: any) {
  return array.reduce((rv: any, x: any) => {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
}
