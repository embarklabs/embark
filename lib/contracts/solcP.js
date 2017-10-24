let solc;

process.on('message', function (msg) {
  if (msg.action === 'loadCompiler') {
    solc = require(msg.solcLocation);
    process.send({result: "loadedCompiler"});
  }

  if (msg.action === 'compile') {
    let output = solc.compile(msg.obj, msg.optimize);
    process.send({result: "compilation", output: output});
  }
});

process.on('exit', function () {
  process.exit(0);
});

