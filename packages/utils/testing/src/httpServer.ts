import http from "http";
import net from "net";
import { waterfall } from "async";
import { promisify } from 'util';

enum Method {
  GET,
  POST
}

export interface Route {
  path: string;
  result: string;
  statusCode: number;
  method?: Method;
}
export default class HttpMockServer {
  private routes: Route[] = [];
  private server: http.Server;
  private sock: net.Server;
  private connectionString: string = "";
  constructor() {
    this.sock = net.createServer();
    this.server = http.createServer(this.handleRequestWrapper.bind(this));
  }

  public init() {
    return new Promise((resolve, reject) => {
      let port;
      waterfall([
        cb => { this.sock.listen(0, cb); },
        cb => {
          const address = this.sock.address() as net.AddressInfo;
          if (!address) {
            cb("Could not get an address from the socket");
          }
          port = address.port;
          cb();
        },
        cb => { this.sock.close(cb); },
        cb => { this.server.listen(port, '127.0.0.1', () => cb()); }
      ], (err) => {
        if (err) {
          return reject(err);
        }
        this.connectionString = `http://localhost:${port}`;
        resolve(this.connectionString);
      });
    });
  }

  private handleRequestWrapper(req: http.IncomingMessage, res: http.ServerResponse) {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      let jsonBody = {};
      if (body) {
        jsonBody = JSON.parse(body);
      }
      this.handleRequest(req.url, jsonBody, res);
    });
  }

  protected handleRequest(path: string | undefined = "", req: object, res: http.ServerResponse) {
    const route = this.routes[path];
    if (!route) {
      res.statusCode = 404;
      return res.end();
    }

    res.writeHead(route.statusCode, {
      'Content-Length': Buffer.byteLength(route.result),
      'Content-Type': 'application/json'
    });
    res.end(route.result);
  }

  public addRoute(route: Route) {
    if (!route.statusCode) {
      route.statusCode = 200;
    }
    if (!route.method) {
      route.method = Method.GET;
    }
    this.routes[route.path] = route;
  }

  public teardown() {
    this.routes = [];
  }
}
