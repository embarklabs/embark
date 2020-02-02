import Storage from './storage';
import Names from './names';
import Messages from './messages';
import Blockchain from './blockchain';
import Utils from './utils';

var EmbarkJS = {
  onReady: function (cb) {
    if (Blockchain.blockchainConnector) {
      return Blockchain.execWhenReady(cb);
    }
    cb();
  },
  enableEthereum: function () {
    return Blockchain.enableEthereum();
  },
  get isNode() {
    return typeof process !== 'undefined' && process.versions && process.versions.node;
  }
};

EmbarkJS.Blockchain = Blockchain;
EmbarkJS.Storage = Storage;
EmbarkJS.Names = Names;
EmbarkJS.Messages = Messages;
EmbarkJS.Utils = Utils;
EmbarkJS.Contract = function() {
  throw new Error('EmbarkJS.Contract is deprecated: please use EmbarkJS.Blockchain.Contract instead');
};
EmbarkJS.isNewWeb3 = function() {
  throw new Error('EmbarkJS.isNewWeb3 is deprecated: only Web3 >=1.2.6 is supported now');
};

export default EmbarkJS;
