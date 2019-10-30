export function filesMatchingPattern(files) {
  const globule = require('globule');
  return globule.find(files, {nonull: true});
}

export function fileMatchesPattern(patterns, intendedPath) {
  const globule = require('globule');
  return globule.isMatch(patterns, intendedPath);
}
