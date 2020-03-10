import { Embark, EmbarkEvents } from "embark-core";
import { Logger } from 'embark-logger';
export default class BlockchainAPI {
  private embark: Embark;
  private logger: Logger;
  private events: EmbarkEvents;
  private apiPlugins: Map<string, Map<string, (...args: any[]) => void>> = new Map();
  private requestPlugins: Map<string, Map<string, (...args: any[]) => any>> = new Map();
  constructor(embark: Embark) {
    this.embark = embark;
    this.logger = embark.logger;
    this.events = embark.events;

    this.embark.events.setCommandHandler("blockchain:api:register", (blockchainName: string, callName: string, executionCb: () => void) => {
      let apiPlugin = this.apiPlugins.get(blockchainName);
      if (!apiPlugin) {
        apiPlugin = new Map();
        this.apiPlugins.set(blockchainName, apiPlugin);
      }
      if (apiPlugin.has(callName)) {
        this.embark.logger.warn(`${blockchainName} blockchain API for call '${callName}' is being overwritten.`);
      }
      apiPlugin.set(callName, executionCb);
    });
    this.embark.events.setCommandHandler("blockchain:request:register", (blockchainName: string, requestName: string, executionCb: () => void) => {
      let requestPlugin = this.requestPlugins.get(blockchainName);
      if (!requestPlugin) {
        requestPlugin = new Map();
        this.requestPlugins.set(blockchainName, requestPlugin);
      }
      if (requestPlugin.has(requestName)) {
        this.embark.logger.warn(`${blockchainName} blockchain request for '${requestName}' is being overwritten.`);
      }
      requestPlugin.set(requestName, executionCb);
    });
  }

  private getCallForBlockchain(blockchainName: string, callName: string) {
    const apiPlugin = this.apiPlugins.get(blockchainName);
    if (!apiPlugin) {
      throw new Error(`Blockchain '${blockchainName}' does not have any APIs registered.`);
    }
    const apiPluginExecCb = apiPlugin.get(callName);
    if (!apiPluginExecCb) {
      throw new Error(`API call '${callName}' is not registered as an API plugin for the '${blockchainName}' blockchain.`);
    }
    return apiPluginExecCb;
  }

  private getRequestForBlockchain(blockchainName: string, callName: string) {
    const requestPlugin = this.requestPlugins.get(blockchainName);
    if (!requestPlugin) {
      throw new Error(`Blockchain '${blockchainName}' does not have any requests registered.`);
    }
    const requestPluginExecCb = requestPlugin.get(callName);
    if (!requestPluginExecCb) {
      throw new Error(`Request '${callName}' is not registered as a request plugin for the '${blockchainName}' blockchain.`);
    }
    return requestPluginExecCb;
  }

  protected registerRequests(blockchainName: string) {
    // TODO: Re-add blockchain:reset for tests?
    // this.events.setCommandHandler("blockchain:reset", async (cb) => {
    //   const initWeb3 = this.getRequestForBlockchain(blockchainName, "initWeb3");
    //   await initWeb3();
    //   this.events.emit("blockchain:reseted");
    //   cb();
    // });

    this.events.setCommandHandler("blockchain:get", async (cb) => {
      const blockchainObject = await this.getRequestForBlockchain(blockchainName, "blockchainObject");
      cb(blockchainObject);
    });

    this.events.setCommandHandler("blockchain:defaultAccount:get", (cb) => {
      const getDefaultAccount = this.getRequestForBlockchain(blockchainName, "getDefaultAccount");
      cb(null, getDefaultAccount());
    });

    this.events.setCommandHandler("blockchain:defaultAccount:set", (account, cb) => {
      const setDefaultAccount = this.getRequestForBlockchain(blockchainName, "setDefaultAccount");
      setDefaultAccount(account);
      cb();
    });

    this.events.setCommandHandler("blockchain:getAccounts", (cb) => {
      const getAccounts = this.getRequestForBlockchain(blockchainName, "getAccounts");
      getAccounts(cb);
    });

    this.events.setCommandHandler("blockchain:getBalance", (address, cb) => {
      const getBalance = this.getRequestForBlockchain(blockchainName, "getBalance");
      getBalance(address, cb);
    });

    this.events.setCommandHandler("blockchain:block:byNumber", (blockNumber, cb) => {
      const getBlock = this.getRequestForBlockchain(blockchainName, "getBlock");
      getBlock(blockNumber, cb);
    });

    this.events.setCommandHandler("blockchain:block:byHash", (blockHash, cb) => {
      const getBlock = this.getRequestForBlockchain(blockchainName, "getBlock");
      getBlock(blockHash, cb);
    });

    this.events.setCommandHandler("blockchain:gasPrice", (cb) => {
      const getGasPrice = this.getRequestForBlockchain(blockchainName, "getGasPrice");
      getGasPrice(cb);
    });

    this.events.setCommandHandler("blockchain:networkId", (cb) => {
      const getNetworkId = this.getRequestForBlockchain(blockchainName, "getNetworkId");
      getNetworkId(cb);
    });

    this.events.setCommandHandler("blockchain:getTransaction", async (txId, cb) => {
      const getTransaction = this.getRequestForBlockchain(blockchainName, "getTransaction");
      getTransaction(txId, cb);
    });

    this.events.setCommandHandler("blockchain:contract:create", (params, cb) => {
      const contractObject = this.getRequestForBlockchain(blockchainName, "contractObject")(params);
      cb(contractObject);
    });
  }

  protected registerAPIs(blockchainName: string) {
    this.embark.registerAPICall(
      "get",
      "/embark-api/blockchain/accounts",
      (req, res) => {
        try {
          const getAccountsWithTransactionCount = this.getCallForBlockchain(blockchainName, "getAccountsWithTransactionCount");
          getAccountsWithTransactionCount(res.send.bind(res));
        } catch (error) {
          res.status(500).send({ error });
        }
      },
    );

    this.embark.registerAPICall(
      "get",
      "/embark-api/blockchain/accounts/:address",
      (req, res) => {
        try {
          const getAccount = this.getCallForBlockchain(blockchainName, "getAccount");
          getAccount(req.params.address, res.send.bind(res));
        } catch (error) {
          res.status(500).send({ error });
        }
      },
    );

    this.embark.registerAPICall(
      "get",
      "/embark-api/blockchain/blocks",
      (req, res) => {
        try {
          const getBlocks = this.getCallForBlockchain(blockchainName, "getBlocks");
          const from = parseInt(req.query.from, 10);
          const limit = req.query.limit || 10;
          getBlocks(from, limit, !!req.query.txObjects, !!req.query.txReceipts, res.send.bind(res));
        } catch (error) {
          res.status(500).send({ error });
        }
      },
    );

    this.embark.registerAPICall(
      "get",
      "/embark-api/blockchain/blocks/:blockNumber",
      (req, res) => {
        try {
          const getBlock = this.getCallForBlockchain(blockchainName, "getBlock");
          getBlock(req.params.blockNumber, (err: Error, block: any) => {
            if (err) {
              this.logger.error(err.message);
            }
            res.send(block);
          });
        } catch (error) {
          res.status(500).send({ error });
        }
      },
    );

    this.embark.registerAPICall(
      "get",
      "/embark-api/blockchain/transactions",
      (req, res) => {
        try {
          const blockFrom = parseInt(req.query.blockFrom, 10);
          const blockLimit = req.query.blockLimit || 10;
          const getTransactions = this.getCallForBlockchain(blockchainName, "getTransactions");
          getTransactions(blockFrom, blockLimit, res.send.bind(res));
        } catch (error) {
          res.status(500).send({ error });
        }
      },
    );

    this.embark.registerAPICall(
      "get",
      "/embark-api/blockchain/transactions/:hash",
      (req, res) => {
        try {
          const getTransactionByHash = this.getCallForBlockchain(blockchainName, "getTransactionByHash");
          const getTransactionByRawTransactionHash = this.getCallForBlockchain(blockchainName, "getTransactionByRawTransactionHash");
          getTransactionByHash(req.params.hash, (err: Error, transaction: any) => {
            if (!err) {
              return res.send(transaction);
            }

            getTransactionByRawTransactionHash(req.params.hash, (errRaw: Error, transactionRaw: any) => {
              if (errRaw) {
                return res.send({ error: "Could not find or decode transaction hash" });
              }
              res.send(transactionRaw);
            });
          });
        } catch (error) {
          res.status(500).send({ error });
        }
      },
    );

    this.embark.registerAPICall(
      "ws",
      "/embark-api/blockchain/blockHeader",
      (ws) => {
        this.events.on("block:header", (block: any) => {
          ws.send(JSON.stringify({ block }), () => { });
        });
      },
    );

    this.embark.registerAPICall(
      "ws",
      "/embark-api/blockchain/contracts/event",
      (ws) => {
        this.events.on("blockchain:contracts:event", (data: any) => {
          ws.send(JSON.stringify(data), () => { });
        });
      },
    );

    this.embark.registerAPICall(
      "get",
      "/embark-api/blockchain/contracts/events",
      async (_req, res) => {
        try {
          const getEvents = this.getCallForBlockchain(blockchainName, "getEvents");
          res.send(await getEvents(true));
        } catch (error) {
          res.status(500).send({ error });
        }
      },
    );

    this.embark.registerAPICall(
      "post",
      "/embark-api/messages/sign",
      async (req, res) => {
        try {
          const signer = req.body.address;
          const message = req.body.message;
          const signMessage = this.getCallForBlockchain(blockchainName, "signMessage");
          const signature = await signMessage(message, signer);
          res.send({ signer, signature, message });
        } catch (error) {
          res.status(500).send({ error });
        }
      },
    );

    this.embark.registerAPICall(
      "post",
      "/embark-api/messages/verify",
      async (req, res) => {
        try {
          const verifyMessage = this.getCallForBlockchain(blockchainName, "verifyMessage");
          const signature = JSON.parse(req.body.message);
          const address = await verifyMessage(signature.message, signature.signature);
          res.send({ address });
        } catch (error) {
          res.status(500).send({ error });
        }
      },
    );

  }

}
