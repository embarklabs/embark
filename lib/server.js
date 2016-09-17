var finalhandler = require('finalhandler');
var http = require('http');
var serveStatic = require('serve-static');

var Server = function(options) {
  this.dist = options.dist || 'dist/';
  this.port = options.port || 8000;
  this.logger = options.logger;
};

Server.prototype.start = function(callback) {
  var serve = serveStatic(this.dist, {'index': ['index.html', 'index.htm']});

  var server = http.createServer(function onRequest (req, res) {
    serve(req, res, finalhandler(req, res));
  });

  this.logger.info(("listening on port " + this.port).underline.green);
  server.listen(this.port) ;
  callback();
};

module.exports = Server;
