var program = require('vorpal')();
var colors = require('colors');
var path = require('path');
var Embark = require('../lib/index');

this.version = Embark.version;

this.noargs = program.parse(process.argv, {use: 'minimist'})._ === undefined;

program
  .command('some-cmd', 'just a mock command')
  .autocomplete(['new', 'demo', 'build'])
  .action(function (args, cb) {
    // do the command stuff
    // ...
    console.log('some-cmd invoked');
    // setTimeout(function () {
    //   console.log('some-cmd completed after 1000 ms');
      return this.noargs ? cb() : null; // <<----- cb() will drop one back to the vorpal prompt, parse() or show().
    // }, 1000)
  });

program
  .command('new [name]', 'create a new application')
  .action(function (name, cb) {
    if (name === undefined) {
      var parentDirectory = path.dirname(__dirname).split("/").pop();
      return promptly.prompt("Name your app (default is " + parentDirectory + "):", {
        default: parentDirectory,
        validator: validateName
      }, function (err, inputvalue) {
        if (err) {
          console.error('Invalid name:', err.message);
          // Manually call retry
          // The passed error has a retry method to easily prompt again.
          err.retry();
        } else {
          //slightly different assignment of name since it comes from child prompt
          Embark.generateTemplate('boilerplate', './', inputvalue);
        }
      });
    } else {
      Embark.generateTemplate('boilerplate', './', name);
    }

  });

if (this.noargs) {
  program
    .delimiter('embark $')
    .exec('help')
} else {
  // argv is mutated by the first call to parse.
  process.argv.unshift('');
  process.argv.unshift('');
  program
    .on('client_command_executed', function (evt) {
      process.exit(0)
    })
    .delimiter('embark $')
    .parse(process.argv)
}