const uuid = require("uuid/v4");
// @ts-ignore
const utils = require("../../utils/utils.js");
const keccak = require("keccakjs");

const ERROR_OBJ = {error: __("Wrong authentication token. Get your token from the Embark console by typing `token`")};

class Authenticator {
  private embark: any;
  private logger: any;
  private events: any;
  private authToken: any;
  private emittedTokens: any;

  constructor(embark: any, _options?: any) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;

    this.authToken = uuid();
    this.emittedTokens = {};

    this.registerCalls();
    this.registerEvents();
  }

  private getRemoteAddress(req: any) {
    return (req.headers && req.headers["x-forwarded-for"]) ||
      (req.connection && req.connection.remoteAddress) ||
      (req.socket && req.socket.remoteAddress) ||
      (req._socket && req._socket.remoteAddress);
  }

  private generateRequestHash(req: any, token?: string) {
    const remoteAddress = this.getRemoteAddress(req);
    const cnonce = req.headers["x-embark-cnonce"];

    // We fallback to an empty string so that the hashing won"t fail.
    token = token || this.emittedTokens[remoteAddress] || "";

    let url = req.url;
    const queryParamIndex = url.indexOf("?");
    url = url.substring(0, queryParamIndex !== -1 ? queryParamIndex : url.length);

    const hash = new keccak();
    hash.update(cnonce);
    hash.update(token);
    hash.update(req.method.toUpperCase());
    hash.update(url);
    return hash.digest("hex");
  }

  private registerCalls() {
    this.embark.registerAPICall(
      "post",
      "/embark-api/authenticate",
      (req: any, res: any) => {
        const hash = this.generateRequestHash(req, this.authToken);
        if (hash !== req.headers["x-embark-request-hash"]) {
          this.logger.warn(__("Someone tried and failed to authenticate to the backend"));
          this.logger.warn(__("- User-Agent: %s", req.headers["user-agent"]));
          this.logger.warn(__("- Referer: %s", req.headers.referer));
          return res.send(ERROR_OBJ);
        }

        // Generate another authentication token.
        this.authToken = uuid();
        this.events.request("authenticator:displayUrl", false);

        // Register token for this connection, and send it through.
        const emittedToken = uuid();
        const remoteAddress = this.getRemoteAddress(req);
        this.emittedTokens[remoteAddress] = emittedToken;
        res.send({token: emittedToken});
      },
    );

    this.embark.registerConsoleCommand({
      description: __("Copies and prints the token for the cockpit"),
      matches: ["token"],
      process: (cmd: any, callback: any) => {
        utils.copyToClipboard(this.authToken);
        callback(null, __("Token copied to clipboard: %s", this.authToken));
      },
    });
  }

  private registerEvents() {
    this.events.once("outputDone", () => {
      this.events.request("authenticator:displayUrl", true);
    });

    this.events.setCommandHandler("authenticator:displayUrl", (firstOutput: any) => {
      const {protocol, port, host, enabled} = this.embark.config.webServerConfig;

      if (enabled) {
        if (!firstOutput) {
          this.logger.info(__("Previous token has now been used."));
        }
        this.logger.info(__("Access the web backend with the following url: %s",
          (`${protocol}://${host}:${port}/embark?token=${this.authToken}`.underline)));
      }
    });

    this.events.setCommandHandler("authenticator:authorize", (req: any, res: any, cb: any) => {
      // HACK
      if (res.send && req.url === "/embark-api/authenticate") {
        return cb();
      }

      let authenticated = false;

      if (!res.send) {
        const [cnonce, hash] = req.protocol.split("|");
        const computedHash = this.generateRequestHash({
            headers: {
              "x-embark-cnonce": cnonce,
              "x-forwarded-for": this.getRemoteAddress(req),
            },
            method: "ws",
            url: "/embark-api/",
        });
        authenticated = (hash === computedHash);
      } else {
        const hash = this.generateRequestHash(req);
        authenticated = (hash === req.headers["x-embark-request-hash"]);
      }

      if (authenticated) {
        return cb();
      }
      cb(ERROR_OBJ);
    });
  }
}

module.exports = Authenticator;
