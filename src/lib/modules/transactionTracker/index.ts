
class TransactionTracker {
  private logger: any;
  private events: any;
  private transactions: any;
  private embark: any;
  private startTimestamp: any;

  constructor(embark: any, _options: any) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.transactions = {};
    this.embark = embark;
    this.startTimestamp = Date.now() / 1000;

    embark.events.on("block:pending:transaction", this.onPendingTransaction.bind(this));
    embark.events.on("block:header", this.onBlockHeader.bind(this));
    this.registerAPICalls();
  }

  private onPendingTransaction(pendingTransactionHash: string) {
    this.transactions[pendingTransactionHash] = {
      startTimestamp: Date.now() / 1000,
    };
  }

  private onBlockHeader(blockHeader: any) {
    this.events.request("blockchain:block:byNumber", blockHeader.number , (err: any, block: any) => {
      if (err) {
        return this.logger.error("Error getting block header", err.message || err);
      }
      // Don"t know why, but sometimes we receive nothing
      if (!block || !block.transactions) {
        return;
      }
      block.transactions.forEach((transaction: any) => {
        if (this.transactions[transaction.hash]) {
          let wait = block.timestamp - this.transactions[transaction.hash].startTimestamp;
          if (wait < 0.1) {
            wait = 0.1;
          }
          Object.assign(this.transactions[transaction.hash],
            {endTimestamp: block.timestamp, wait, gasPrice: transaction.gasPrice});
        }
      });
      this.events.emit("blockchain:gas:oracle:new");
      this.cullOldTransactions();
    });
  }

  private cullOldTransactions() {
    const timeLimit = (Date.now() / 1000) - 600; // Transactions old of 10 minutes are not to be counted anymore
    if (this.startTimestamp > timeLimit) {
      return;
    }
    Object.keys(this.transactions).forEach((transactionHash: string) => {
      if (this.transactions[transactionHash].startTimestamp < timeLimit) {
        delete this.transactions[transactionHash];
      }
    });
  }

  private calculateGasPriceSpeeds() {
    return Object.keys(this.transactions).reduce((acc: any, transactionHash: string) => {
      const transaction = this.transactions[transactionHash];
      if (!transaction.gasPrice) {
        return acc;
      }
      if (!acc[transaction.gasPrice]) {
        acc[transaction.gasPrice] = {
          nbTxs: 0,
          totalWait: 0,
        };
      }
      acc[transaction.gasPrice].nbTxs++;
      acc[transaction.gasPrice].totalWait += transaction.wait;
      acc[transaction.gasPrice].averageWait = acc[transaction.gasPrice].totalWait / acc[transaction.gasPrice].nbTxs;

      return acc;
    }, {});
  }

  private registerAPICalls() {
    this.embark.registerAPICall(
      "get",
      "/embark-api/blockchain/gas/oracle",
      (req: any, res: any) => {
        res.send(this.calculateGasPriceSpeeds());
      },
    );
    this.embark.registerAPICall(
      "ws",
      "/embark-api/blockchain/gas/oracle",
      (ws: any) => {
        this.events.on("blockchain:gas:oracle:new", () => {
          ws.send(JSON.stringify(this.calculateGasPriceSpeeds()), () => {});
        });
      },
    );
  }
}

export default TransactionTracker;
