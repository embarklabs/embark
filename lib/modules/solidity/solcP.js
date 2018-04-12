let solc;

let fs = require('fs-extra');
let path = require('path');

function findImports(filename) {
  if (fs.existsSync(filename)) {
    return {contents: fs.readFileSync(filename).toString()};
  }
  if (fs.existsSync(path.join('./node_modules/', filename))) {
    return {contents: fs.readFileSync(path.join('./node_modules/', filename)).toString()};
  }
  return {error: 'File not found'};
}

process.on('message', function (msg) {
  if (msg.action === 'loadCompiler') {
    solc = require(msg.solcLocation);
    process.send({result: "loadedCompiler"});
  }

  if (msg.action === 'compile') {
    // TODO: only available in 0.4.11; need to make versions warn about this
    let output = solc.compileStandardWrapper(JSON.stringify(msg.jsonObj), findImports);
    process.send({result: "compilation", output: output});
  }
});

process.on('exit', function () {
  process.exit(0);
});

