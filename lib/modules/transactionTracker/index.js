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
      block.transactions.forEach(transaction => {
        if (this.transactions[transaction.hash]) {
          Object.assign(this.transactions[transaction.hash], transaction, {endTimestamp: block.timestamp, wait: block.timestamp - this.transactions[transaction.hash].startTimestamp});
        }
      });
    });
  }
}

module.exports = TransactionTracker;
