class TransactionTracker {
  constructor(embark, _options) {
    this.logger = embark.logger;
    this.events = embark.events;
    this.transactions = {};

    embark.events.on("block:pending:transaction", this.onPendingTransaction.bind(this));
    embark.events.on("block:header", this.onBlockHeader.bind(this));
  }

  onPendingTransaction(pendingTransaction) {
    this.transactions[pendingTransaction] = {
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
          Object.assign(this.transactions[transaction.hash], transaction, {endTimestamp: block.timestamp, wait: block.timestamp - this.transactions[transaction.hash].startTimestamp});
        }
      });
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
}

module.exports = TransactionTracker;
