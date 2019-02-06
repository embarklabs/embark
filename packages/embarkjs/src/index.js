import Storage from './storage';
import Names from './names';
import Messages from './messages';
import Blockchain from './blockchain';
import Utils from './utils';

var EmbarkJS = {
  onReady: function (cb) {
    Blockchain.execWhenReady(cb);
  },
  enableEthereum: function () {
    return Blockchain.enableEthereum();
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
  throw new Error('EmbarkJS.isNewWeb3 is deprecated: only Web3 1.0 is supported now');
};

export default EmbarkJS;
