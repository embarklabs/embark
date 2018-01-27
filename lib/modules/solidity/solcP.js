let solc;

process.on('message', function (msg) {
  if (msg.action === 'loadCompiler') {
    solc = require(msg.solcLocation);
    process.send({result: "loadedCompiler"});
  }

  if (msg.action === 'compile') {
    // TODO: only available in 0.4.11; need to make versions warn about this
    let output = solc.compileStandardWrapper(JSON.stringify(msg.jsonObj));
    process.send({result: "compilation", output: output});
  }
});

process.on('exit', function () {
  process.exit(0);
});

