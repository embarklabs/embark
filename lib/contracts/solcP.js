var solc;

process.on('message', function(msg) {
  if (msg.action === 'loadCompiler') {
    solc = require('solc');
    process.send({result: "loadedCompiler"});
  }

  if (msg.action === 'compile') {
    var output = solc.compile(msg.obj, msg.optimize);
    process.send({result: "compilation", output: output});
  }
});

process.on('exit', function() {
  process.exit(0);
});

