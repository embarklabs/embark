let async = require('async');

function asyncEachObject(object, iterator, callback) {
  async.each(
    Object.keys(object || {}),
    function (key, next) {
      iterator(key, object[key], next);
    },
    callback
  );
}

async.eachObject = asyncEachObject;

module.exports = async;
