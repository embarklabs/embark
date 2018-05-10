var fs = require('../core/fs.js');

module.exports = function() {
  fs.removeSync('./chains.json');
  fs.removeSync('.embark/');
  fs.removeSync('dist/');
  console.log(__("reset done!").green);
};
