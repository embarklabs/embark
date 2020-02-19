/*global artifacts, contract, config, it, web3, evmMethod*/
const assert = require('assert');
const AnotherStorage = artifacts.require('AnotherStorage');
const SimpleStorage = artifacts.require('SimpleStorage');

let accounts, defaultAccount;
const numAddresses = 10;

config({
  blockchain: {
    "accounts": [
      {
        "mnemonic": "example exile argue silk regular smile grass bomb merge arm assist farm",
        balance: "5ether",
        hdpath: "m/44'/1'/0'/0/",
        numAddresses: 10
      }
    ]
  },
  contracts: {
    deploy: {
      "SimpleStorage": {
        args: [100]
      },
      "AnotherStorage": {
        args: ["$SimpleStorage"]
      }
    }
  }
}, (err, theAccounts) => {
  accounts = theAccounts;
  defaultAccount = accounts[0];
});

contract("AnotherStorage", function() {
  this.timeout(0);

  it("should have got the default account in the describe", function () {
    assert.strictEqual(defaultAccount, accounts[0]);
  });

  it("should have account with balance", async function() {
    const balance = await web3.eth.getBalance(accounts[0]);
    assert.ok(parseInt(balance, 10) > 4900000000000000000);
    assert.ok(parseInt(balance, 10) <= 5000000000000000000);
  });

  it("should have the right balance for all other accounts ", async function() {
    let balance;

    for (let i = 1; i < numAddresses - 3; i++) {
      balance = await web3.eth.getBalance(accounts[i]);
      assert.strictEqual(parseInt(balance, 10), 5000000000000000000, `Account ${i} doesn't have the balance set`);
    }
  });

  it("set SimpleStorage address", async function() {
    let result = await AnotherStorage.methods.simpleStorageAddress().call();
    assert.equal(result.toString(), SimpleStorage.options.address);
  });

  it("set SimpleStorage address with alternative syntax", async function() {
    let result = await AnotherStorage.simpleStorageAddress();
    assert.equal(result.toString(), SimpleStorage.options.address);
  });

  it("can sign using eth_signTypedData with a custom account", async function() {
    const chainId = await web3.eth.net.getId();

    const domain = [
      {name: "name", type: "string"},
      {name: "version", type: "string"},
      {name: "chainId", type: "uint256"},
      {name: "verifyingContract", type: "address"}
    ];

    const redeem = [
      {name: "keycard", type: "address"},
      {name: "receiver", type: "address"},
      {name: "code", type: "bytes32"}
    ];

    const domainData = {
      name: "KeycardGift",
      version: "1",
      chainId,
      verifyingContract: SimpleStorage.options.address
    };

    const message = {
      keycard: accounts[1],
      receiver: accounts[2],
      code: web3.utils.sha3("hello world")
    };

    const data = {
      types: {
        EIP712Domain: domain,
        Redeem: redeem
      },
      primaryType: "Redeem",
      domain: domainData,
      message
    };

    const signature = await evmMethod("eth_signTypedData", [
      accounts[0],
      data
    ]);
    assert.strictEqual(signature, '0x5dcbab53809985222a62807dd2f23551902fa4471377e319d5d682e1458646714cc71' +
      'faa76cf6de3e0d871edbfa85628db552619d681594d5af2f34be2c33cdd1b');
  });
});
