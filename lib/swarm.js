var colors = require('colors');

var Swarm = function(options) {
  this.options = options;
  this.buildDir = options.buildDir || 'dist/';
};

Swarm.prototype.deploy = function() {
  var swarm_bin = exec('which swarm').output.split("\n")[0];

  if (swarm_bin==='swarm not found' || swarm_bin === ''){
    console.log('=== WARNING: Swarm not in an executable path. Guessing ~/go/bin/swarm for path'.yellow);
    swarm_bin = "~/go/bin/swarm";
  }

  var cmd = swarm_bin + " --defaultpath " + this.buildDir + "index.html --recursive up " + this.buildDir;
  console.log(("=== adding " + this.buildDir + " to swarm").green);
  console.log(cmd.green);

  var result = exec(cmd);
  var rows = result.output.split("\n");
  var dir_hash = rows.reverse()[1];

  console.log(("=== DApp available at http://localhost:8500/bzz:/" + dir_hash + "/").green);
};

module.exports = Swarm;


