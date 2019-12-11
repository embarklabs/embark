/*globals describe, it, beforeEach*/
const {expect} = require('chai');
import { getAddressToContract, getTransactionParams } from 'embark-transaction-logger';
require('colors');

let contractsList;

function resetTest() {
  contractsList = [
    {
      abiDefinition: [
        {
          "constant": true,
          "inputs": [],
          "name": "storedData",
          "outputs": [
            {
              "name": "",
              "type": "uint256"
            }
          ],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        },
        {
          "constant": false,
          "inputs": [
            {
              "name": "x",
              "type": "uint256"
            }
          ],
          "name": "set",
          "outputs": [],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "constant": true,
          "inputs": [],
          "name": "get",
          "outputs": [
            {
              "name": "retVal",
              "type": "uint256"
            }
          ],
          "payable": false,
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {
              "name": "initialValue",
              "type": "uint256"
            }
          ],
          "payable": false,
          "stateMutability": "nonpayable",
          "type": "constructor"
        }
      ],
      deployedAddress: "0x12345",
      className: "SimpleStorage",
      silent: true
    }
  ];
}

describe('Transaction Utils', () => {
  beforeEach(() => {
    resetTest();
  });

  describe('#getAddressToContract', () => {
    it('should not update contracts list when no contracts', () => {
      contractsList = [];
      const result = getAddressToContract(contractsList, {});

      expect(result).to.deep.equal({});
    });

    it('should not update contracts list when not deployed', () => {
      contractsList[0].deployedAddress = undefined;
      const result = getAddressToContract(contractsList, {});

      expect(result).to.deep.equal({});
    });

    it('should update contracts list', () => {
      const result = getAddressToContract(contractsList, {});

      expect(result).to.deep.equal({
        "0x12345": {
          name: "SimpleStorage",
          functions: {
            "0x2a1afcd9": {
              "abi": {
                "constant": true,
                "inputs": [],
                "name": "storedData",
                "outputs": [
                  {
                    "name": "",
                    "type": "uint256"
                  }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
              },
              "functionName": "storedData",
              "name": "storedData()"
            },
            "0x60fe47b1": {
              "abi": {
                "constant": false,
                "inputs": [
                  {
                    "name": "x",
                    "type": "uint256"
                  }
                ],
                "name": "set",
                "outputs": [],
                "payable": false,
                "stateMutability": "nonpayable",
                "type": "function"
              },
              "functionName": "set",
              "name": "set(uint256)"
            },
            "0x6d4ce63c": {
              "abi": {
                "constant": true,
                "inputs": [],
                "name": "get",
                "outputs": [
                  {
                    "name": "retVal",
                    "type": "uint256"
                  }
                ],
                "payable": false,
                "stateMutability": "view",
                "type": "function"
              },
              "functionName": "get",
              "name": "get()"
            }
          },
          silent: true
        }
      });
    });
  });

  describe('#getTransactionParams', () => {
    it('should return the param string and function name', () => {
      const result = getAddressToContract(contractsList, {});
      const {functionName, paramString} = getTransactionParams(result['0x12345'], '0x60fe47b100000000000000000000000099db99c77ad807f89829f5bda99527438f64a798');
      expect(functionName).to.equal('set');
      expect(paramString).to.equal('878372847193751743539905734564138820017777321880');

    });
  });
});
