// util to map async method names

function extend(filename, async) {
  if (async._waterfall !== undefined) {
    return;
  }
  async._waterfall = async.waterfall;
  async.waterfall = function(_tasks, callback) {
    var tasks = _tasks.map(function(t) { 
      var fn = function() {
        console.log("async " + filename + ": " + t.name);
        t.apply(t, arguments);
      };
      return fn;
    });
    async._waterfall(tasks, callback);
  };
}

module.exports = extend;
