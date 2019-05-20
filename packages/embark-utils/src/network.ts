import * as fs from "fs-extra";
import * as net from "net";
const http = require("follow-redirects").http;
const https = require("follow-redirects").https;

export function findNextPort(port: number) {
  const server = net.createServer();
  return new Promise<number>((resolve) => {
    server.once("close", () => resolve(port));
    server.on("error", () => resolve(findNextPort(port + 1)));
    server.listen(port, () => server.close());
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
