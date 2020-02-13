/*global assert, web3*/

// This has been tested with the real Ethereum network and Testrpc.
// Copied and edited from: https://gist.github.com/xavierlepretre/d5583222fde52ddfbc58b7cfa0d2d0a9
exports.assertReverts = (contractMethodCall, maxGasAvailable) => {
  return new Promise((resolve, reject) => {
    try {
      resolve(contractMethodCall());
    } catch (error) {
      reject(error);
    }
  })
    .then(tx => {
      assert.equal(tx.receipt.gasUsed, maxGasAvailable, "tx successful, the max gas available was not consumed");
    })
    .catch(error => {
      if ((String(error)).indexOf("invalid opcode") < 0 && (String(error)).indexOf("out of gas") < 0) {
        // Checks if the error is from TestRpc. If it is then ignore it.
        // Otherwise relay/throw the error produced by the above assertion.
        // Note that no error is thrown when using a real Ethereum network AND the assertion above is true.
        throw error;
      }
    });
};

exports.listenForEvent = event => new Promise((resolve, reject) => {
  event({}, (error, response) => {
    if (!error) {
      resolve(response.args);
    } else {
      reject(error);
    }
    event.stopWatching();
  });
});

exports.eventValues = (receipt, eventName) => {
  if (receipt.events[eventName]) return receipt.events[eventName].returnValues;
};

exports.addressToBytes32 = (address) => {
  const stringed = "0000000000000000000000000000000000000000000000000000000000000000" + address.slice(2);
  return "0x" + stringed.substring(stringed.length - 64, stringed.length);
};

// OpenZeppelin's expectThrow helper -
// Source: https://github.com/OpenZeppelin/zeppelin-solidity/blob/master/test/helpers/expectThrow.js
exports.expectThrow = async promise => {
  try {
    await promise;
  } catch (error) {
    // TODO: Check jump destination to destinguish between a throw
    //       and an actual invalid jump.
    const invalidOpcode = error.message.search('invalid opcode') >= 0;
    // TODO: When we contract A calls contract B, and B throws, instead
    //       of an 'invalid jump', we get an 'out of gas' error. How do
    //       we distinguish this from an actual out of gas event? (The
    //       testrpc log actually show an 'invalid jump' event.)
    const outOfGas = error.message.search('out of gas') >= 0;
    const revert = error.message.search('revert') >= 0;
    assert(
      invalidOpcode || outOfGas || revert,
      'Expected throw, got \'' + error + '\' instead',
    );
    return;
  }
  assert.fail('Expected throw not received');
};


exports.assertJump = (error) => {
  assert(error.message.search('VM Exception while processing transaction') > -1, 'Revert should happen');
};


function callbackToResolve(resolve, reject) {
  return function(error, value) {
    if (error) {
      reject(error);
    } else {
      resolve(value);
    }
  };
}

exports.promisify = (func) =>
  (...args) => {
    return new Promise((resolve, reject) => {
      const callback = (err, data) => err ? reject(err) : resolve(data);
      func.apply(this, [...args, callback]);
    });
  };

exports.zeroAddress = '0x0000000000000000000000000000000000000000';
exports.zeroBytes32 = "0x0000000000000000000000000000000000000000000000000000000000000000";
exports.timeUnits = {
  seconds: 1,
  minutes: 60,
  hours: 60 * 60,
  days: 24 * 60 * 60,
  weeks: 7 * 24 * 60 * 60,
  years: 365 * 24 * 60 * 60
};

exports.ensureException = function(error) {
  assert(isException(error), error.toString());
};

function isException(error) {
  let strError = error.toString();
  return strError.includes('invalid opcode') || strError.includes('invalid JUMP') || strError.includes('revert');
}

const evmMethod = (method, params = []) => {
  return new Promise(function(resolve, reject) {
    const sendMethod = (web3.currentProvider.sendAsync) ? web3.currentProvider.sendAsync.bind(web3.currentProvider) : web3.currentProvider.send.bind(web3.currentProvider);
    sendMethod(
      {
        jsonrpc: '2.0',
        method,
        params,
        id: new Date().getSeconds()
      },
      (error, res) => {
        if (error) {
          return reject(error);
        }
        resolve(res.result);
      }
    );
  });
};

exports.evmSnapshot = async () => {
  const result = await evmMethod("evm_snapshot");
  return web3.utils.hexToNumber(result);
};

exports.evmRevert = (id) => {
  const params = [id];
  return evmMethod("evm_revert", params);
};
