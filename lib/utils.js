var path = require('path');

function joinPath() {
  return path.join.apply(path.join, arguments);
}

module.exports = {
  joinPath: joinPath
};

