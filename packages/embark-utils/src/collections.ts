const merge = require("merge");

export function last(array: any) {
  return array[array.length - 1];
}

export function recursiveMerge(target: any, source: any) {
  return merge.recursive(target, source);
}
