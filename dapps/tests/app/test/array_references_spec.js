/*global artifacts, contract, config, it, web3, evmMethod*/
const assert = require('assert');
const SomeContract = artifacts.require('SomeContract');
const MyToken2 = artifacts.require('MyToken2');

let accounts;
config({
  contracts: {
    deploy: {
      "Token": {
        deploy: false,
        args: [1000]
      },
      "MyToken2": {
        instanceOf: "Token",
        args: [2000]
      },
      "SomeContract": {
        "args": [
          ["$MyToken2", "$accounts[0]"],
          100
        ]
      }
    }
  }
}, (err, theAccounts) => {
  accounts = theAccounts;
});

contract("SomeContract", function() {
  this.timeout(0);

  it("set MyToken2 address", async function() {
    let address = await SomeContract.methods.addr_1().call();
    assert.strictEqual(address, MyToken2.options.address);
  });

  it("set account address", async function() {
    let address = await SomeContract.methods.addr_2().call();
    assert.strictEqual(address, web3.eth.defaultAccount);
  });

  it("can sign using eth_signTypedData with a node account", async function() {
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
      verifyingContract: SomeContract.options.address
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
    // Impossible to tell what the signature will be because the account is not deterministic
    assert.ok(signature);
  });
});
