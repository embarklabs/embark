import { FollowResponse, http, https } from "follow-redirects";
import * as fs from "fs-extra";
import { IncomingMessage } from "http";
import * as net from "net";

export function findNextPort(port: number) {
  const server = net.createServer();
  return new Promise<number>((resolve) => {
    server.once("close", () => resolve(port));
    server.on("error", () => resolve(findNextPort(port + 1)));
    server.listen(port, 'localhost', () => server.close());
  });
}

export function downloadFile(url: string, dest: string, cb: any) {
  const file = fs.createWriteStream(dest);
  (url.substring(0, 5) === "https" ? https : http).get(url, (response: any) => {
    if (response.statusCode !== 200) {
      cb(`Download failed, response code ${response.statusCode}`);
      return;
    }
    response.pipe(file);
    file.on("finish", () => {
      file.close();
      cb();
    });
  }).on("error", (err: Error) => {
    fs.unlink(dest);
    cb(err.message);
  });
}

enum Protocols {
  http = "http",
  https = "https",
}

const Apis = {
  http,
  https,
};

export function httpGetRequest(protocol: Protocols, url: string, callback: (err: Error | null, body?: string) => any) {
  const httpObj = Apis[protocol];
  httpObj.get(url, (res: IncomingMessage & FollowResponse) => {
    let body = "";
    res.on("data", (d: string) => {
      body += d;
    });
    res.on("end", () => {
      callback(null, body);
    });
  }).on("error", (err: Error) => {
    callback(err);
  });
}

export function httpGet(url: string, callback: any) {
  httpGetRequest(Protocols.http, url, callback);
}

export function httpsGet(url: string, callback: any) {
  httpGetRequest(Protocols.https, url, callback);
}

export function httpGetJson(url: string, callback: any) {
  httpGetRequest(Protocols.http, url, (err: Error | null, body?: string) => {
    try {
      const parsed = body && JSON.parse(body);
      return callback(err, parsed);
    } catch (e) {
      return callback(e);
    }
  });
}

export function httpsGetJson(url: string, callback: any) {
  httpGetRequest(Protocols.https, url, (err: Error | null, body?: string) => {
    try {
      const parsed = body && JSON.parse(body);
      return callback(err, parsed);
    } catch (e) {
      return callback(e);
    }
  });
}

export function getJson(url: string, cb: any) {
  if (url.indexOf("https") === 0) {
    return httpsGetJson(url, cb);
  }
  httpGetJson(url, cb);
}

export function pingEndpoint(host: string, port: number, type: string, protocol: string, origin: string, callback: any) {
  // remove any extra information from a host string, e.g. port, path, query
  const _host = require("url").parse(
    // url.parse() expects a protocol segment else it won't parse as desired
    host.slice(0, 4) === "http" ? host : `${protocol}://${host}`,
  ).hostname;

  let closed = false;
  const close = (req: any, closeMethod: any) => {
    if (!closed) {
      closed = true;
      req[closeMethod]();
    }
  };

  const handleEvent = (req: any, closeMethod: any, ...args: any) => {
    close(req, closeMethod);
    setImmediate(() => { callback(...args); });
  };

  const handleError = (req: any, closeMethod: any) => {
    req.on("error", (err: any) => {
      if (err.code !== "ECONNREFUSED") {
        console.error(
          `Ping: Network error` +
          (err.message ? ` '${err.message}'` : "") +
          (err.code ? ` (code: ${err.code})` : ""),
        );
      }
      // when closed additional error events will not callback
      if (!closed) { handleEvent(req, closeMethod, err); }
    });
  };

  const handleSuccess = (req: any, closeMethod: any, event: any) => {
    req.once(event, () => {
      handleEvent(req, closeMethod);
    });
  };

  const handleRequest = (req: any, closeMethod: any, event: any) => {
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
      {headers, host: _host, port},
    );
    handleRequest(req, "abort", "response");
  }
}
