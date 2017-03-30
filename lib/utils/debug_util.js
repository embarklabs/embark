// util to map async method names

function extend(filename, async) {
  if (async._waterfall !== undefined) {
    return;
  }
  async._waterfall = async.waterfall;
  async.waterfall = function (_tasks, callback) {
    let tasks = _tasks.map(function (t) {
      let fn = function () {
        console.log("async " + filename + ": " + t.name);
        t.apply(t, arguments);
      };
      return fn;
    });
    async._waterfall(tasks, callback);
  };
}

module.exports = extend;
