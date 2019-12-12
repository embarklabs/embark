const WebSocket = require("ws");
const http = require("http");
const https = require("https");

const LIVENESS_CHECK = JSON.stringify({
  jsonrpc:'2.0',
  method: 'shh_version',
  params:[],
  id:42
});

// eslint-disable-next-line complexity
const parseAndRespond = (data, cb) => {
  let resp;
  try {
    resp = JSON.parse(data);
    if (resp.error) {
      return cb(resp.error);
    }
  } catch (e) {
    return cb("Version data is not valid JSON");
  }
  if (!resp || !resp.result) {
    return cb("No version returned");
  }
  cb(null, resp.result);
};

const rpcWithEndpoint = (endpoint, cb) => {
  const options = {
    method: "POST",
    timeout: 1000,
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(LIVENESS_CHECK)
    }
  };

  let obj = http;
  if (endpoint.startsWith('https')) {
    obj = https;
  }

  const req = obj.request(endpoint, options, (res) => {
    let data = "";
    res.on("data", chunk => { data += chunk; });
    res.on("end", () => parseAndRespond(data, cb));
  });
  req.on("error", (e) => cb(e));
  req.write(LIVENESS_CHECK);
  req.end();
};

const ws = (endpoint, cb) => {
  const conn = new WebSocket(endpoint);
  conn.on("message", (data) => {
    parseAndRespond(data, cb);
    conn.close();
  });
  conn.on("open", () => conn.send(LIVENESS_CHECK));
  conn.on("error", (e) => cb(e));
};

module.exports = {
  ws,
  rpcWithEndpoint
};
