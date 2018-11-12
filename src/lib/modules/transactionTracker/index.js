class TransactionTracker {
  constructor(embark, _options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.transactions = {};
    this.embark = embark;
    this.startTimestamp = Date.now() / 1000;

    embark.events.on("block:pending:transaction", this.onPendingTransaction.bind(this));
    embark.events.on("block:header", this.onBlockHeader.bind(this));
    this.registerAPICalls();
  }

  onPendingTransaction(pendingTransactionHash) {
    this.transactions[pendingTransactionHash] = {
      startTimestamp: Date.now() / 1000
    };
  }

  onBlockHeader(blockHeader) {
    this.events.request("blockchain:block:byNumber", blockHeader.hash, (err, block) => {
      if (err) {
        return this.logger.error('Error getting block header', err);
      }
      // Don't know why, but sometimes we receive nothing
      if (!block || !block.transactions) {
        return;
      }
      block.transactions.forEach(transaction => {
        if (this.transactions[transaction.hash]) {
          let wait = block.timestamp - this.transactions[transaction.hash].startTimestamp;
          if (wait < 0.1) {
            wait = 0.1;
          }
          Object.assign(this.transactions[transaction.hash],
            {endTimestamp: block.timestamp, wait, gasPrice: transaction.gasPrice});
        }
      });
      this.events.emit('blockchain:gas:oracle:new');
      this.cullOldTransactions();
    });
  }

  cullOldTransactions() {
    const timeLimit = (Date.now() / 1000) - 600; // Transactions old of 10 minutes are not to be counted anymore
    if (this.startTimestamp > timeLimit) {
      return;
    }
    Object.keys(this.transactions).forEach(transactionHash => {
      if (this.transactions[transactionHash].startTimestamp < timeLimit) {
        delete this.transactions[transactionHash];
      }
    });
  }

  calculateGasPriceSpeeds() {
    return Object.keys(this.transactions).reduce((acc, transactionHash) => {
      const transaction = this.transactions[transactionHash];
      if (!transaction.gasPrice) {
        return acc;
      }
      if (!acc[transaction.gasPrice]) {
        acc[transaction.gasPrice] = {
          nbTxs: 0,
          totalWait: 0
        };
      }
      acc[transaction.gasPrice].nbTxs++;
      acc[transaction.gasPrice].totalWait += transaction.wait;
      acc[transaction.gasPrice].averageWait = acc[transaction.gasPrice].totalWait / acc[transaction.gasPrice].nbTxs;

      return acc;
    }, {});
  }

  registerAPICalls() {
    const self = this;
    self.embark.registerAPICall(
      'get',
      '/embark-api/blockchain/gas/oracle',
      (req, res) => {
        res.send(self.calculateGasPriceSpeeds());
      }
    );
    self.embark.registerAPICall(
      'ws',
      '/embark-api/blockchain/gas/oracle',
      (ws) => {
        self.events.on('blockchain:gas:oracle:new', () => {
          ws.send(JSON.stringify(self.calculateGasPriceSpeeds()), () => {});
        });
      }
    );
  }
}

module.exports = TransactionTracker;
