"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

var _keys = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/keys"));

let async = require('async');

function asyncEachObject(object, iterator, callback) {
  async.each((0, _keys.default)(object || {}), function (key, next) {
    iterator(key, object[key], next);
  }, callback);
}

async.eachObject = asyncEachObject;
module.exports = async;
//# sourceMappingURL=async_extend.js.map