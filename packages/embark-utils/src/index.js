
class Utils {

  static joinPath() {
    const path = require('path');
    return path.join.apply(path.join, arguments);
  }

}

module.exports = Utils;

