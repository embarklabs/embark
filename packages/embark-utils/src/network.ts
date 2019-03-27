import * as net from "net";

export function findNextPort(port: number) {
  const server = net.createServer();
  return new Promise<number>((resolve) => {
    server.once("close", () => resolve(port));
    server.on("error", () => resolve(findNextPort(port + 1)));
    server.listen(port, () => server.close());
  });
}
