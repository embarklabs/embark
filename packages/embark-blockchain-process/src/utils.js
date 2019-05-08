export function pingEndpoint(host, port, type, protocol, origin, callback) {
  // remove any extra information from a host string, e.g. port, path, query
  const _host = require("url").parse(
    // url.parse() expects a protocol segment else it won't parse as desired
    host.slice(0, 4) === "http" ? host : `${protocol}://${host}`
  ).hostname;

  let closed = false;
  const close = (req, closeMethod) => {
    if (!closed) {
      closed = true;
      req[closeMethod]();
    }
  };

  const handleEvent = (req, closeMethod, ...args) => {
    close(req, closeMethod);
    setImmediate(() => { callback(...args); });
  };

  const handleError = (req, closeMethod) => {
    req.on("error", (err) => {
      if (err.code !== "ECONNREFUSED") {
        console.error(
          `Ping: Network error` +
            (err.message ? ` '${err.message}'` : "") +
            (err.code ? ` (code: ${err.code})` : "")
        );
      }
      // when closed additional error events will not callback
      if (!closed) { handleEvent(req, closeMethod, err); }
    });
  };

  const handleSuccess = (req, closeMethod, event) => {
    req.once(event, () => {
      handleEvent(req, closeMethod);
    });
  };

  const handleRequest = (req, closeMethod, event) => {
    handleError(req, closeMethod);
    handleSuccess(req, closeMethod, event);
  };

  if (type === "ws") {
    const url = `${protocol === "https" ? "wss" : "ws"}://${_host}:${port}/`;
    const req = new (require("ws"))(url, origin ? {origin} : {});
    handleRequest(req, "close", "open");
  } else {
    const headers = origin ? {Origin: origin} : {};
    const req = (protocol === "https" ? require("https") : require("http")).get(
      {headers, host: _host, port}
    );
    handleRequest(req, "abort", "response");
  }
}

