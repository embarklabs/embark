/* global require */

const http = require('http');
const https = require('https');
const httpProxyWsIncoming = require('http-proxy/lib/http-proxy/passes/ws-incoming');
const common = require('http-proxy/lib/http-proxy/common');

const CRLF = '\r\n';

httpProxyWsIncoming.stream = (req, socket, options, head, server, cb) => {
  const createHttpHeader = function(line, headers) {
    return Object.keys(headers).reduce(function (head, key) {
      const value = headers[key];
      if (!Array.isArray(value)) {
        head.push(`${key}: ${value}`);
        return head;
      }
      for (let i = 0; i < value.length; i++) {
        head.push(`${key}: ${value[i]}`);
      }
      return head;
    }, [line])
      .join(CRLF) + `${CRLF}${CRLF}`;
  };

  common.setupSocket(socket);

  if (head && head.length) socket.unshift(head);

  const protocol = common.isSSL.test(options.target.protocol) ? https : http;

  const proxyReq = protocol.request(
    common.setupOutgoing(options.ssl || {}, options, req)
  );

  // Enable developers to modify the proxyReq before headers are sent
  if (server) {
    server.emit('proxyReqWs', proxyReq, req, socket, options, head);
  }

  // Error Handler
  proxyReq.on('error', onOutgoingError);
  proxyReq.on('response', function (res) {
    // if upgrade event isn't going to happen, close the socket
    if (!res.upgrade) {
      const {httpVersion, statusCode, statusMessage, headers} = res;
      socket.write(createHttpHeader(
        `HTTP/${httpVersion} ${statusCode} ${statusMessage}`,
        headers
      ));
      res.pipe(socket);
    }
  });

  proxyReq.on('upgrade', function(proxyRes, proxySocket, proxyHead) {
    proxySocket.on('error', onOutgoingError);

    // Allow us to listen when the websocket has completed
    proxySocket.on('end', function () {
      server.emit('close', proxyRes, proxySocket, proxyHead);
    });

    // The pipe below will end proxySocket if socket closes cleanly, but not
    // if it errors (eg, vanishes from the net and starts returning
    // EHOSTUNREACH). We need to do that explicitly.
    socket.on('error', function () {
      proxySocket.end();
    });

    common.setupSocket(proxySocket);

    if (proxyHead && proxyHead.length) proxySocket.unshift(proxyHead);

    // Remark: Handle writing the headers to the socket when switching protocols
    // Also handles when a header is an array
    socket.write(createHttpHeader(
      'HTTP/1.1 101 Switching Protocols',
      proxyRes.headers
    ));

    let proxyStream = proxySocket;

    if (options.createWsServerTransformStream) {
      const wsServerTransformStream = options.createWsServerTransformStream(
        req,
        proxyReq,
        proxyRes,
      );

      wsServerTransformStream.on('error', onOutgoingError);
      proxyStream = proxyStream.pipe(wsServerTransformStream);
    }

    proxyStream = proxyStream.pipe(socket);

    if (options.createWsClientTransformStream) {
      const wsClientTransformStream = options.createWsClientTransformStream(
        req,
        proxyReq,
        proxyRes,
      );

      wsClientTransformStream.on('error', onOutgoingError);
      proxyStream = proxyStream.pipe(wsClientTransformStream);
    }

    proxyStream.pipe(proxySocket);

    server.emit('open', proxySocket);
    server.emit('proxySocket', proxySocket);  //DEPRECATED.
  });

  return proxyReq.end(); // XXX: CHECK IF THIS IS THIS CORRECT

  function onOutgoingError(err) {
    if (cb) {
      cb(err, req, socket);
    } else {
      server.emit('error', err, req, socket);
    }
    socket.end();
  }
};
