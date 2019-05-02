import { Contract } /* supplied by @types/embark in packages/embark-typings */ from "embark";
import { ABIDefinition } from "web3/eth/abi";
import { decodeParams, sha3 } from "./web3Utils";

interface AddressToContract {
  name: string;
  functions: { [functionName: string]: FunctionSignature; };
  silent?: boolean;
}

interface AddressToContractArray {
  [address: string]: AddressToContract;
}

interface FunctionSignature {
  abi: ABIDefinition;
  functionName?: string;
  name: string;
}

export function getAddressToContract(contractsList: Contract[], addressToContract: AddressToContractArray): AddressToContractArray {
  if (!contractsList) {
    return addressToContract;
  }
  contractsList.forEach((contract: Contract) => {
    if (!contract.deployedAddress) {
      return;
    }

    const address = contract.deployedAddress.toLowerCase();
    if (addressToContract[address]) {
      return;
    }
    const funcSignatures: { [name: string]: FunctionSignature } = {};
    contract.abiDefinition
      .filter((func: ABIDefinition) => func.type === "function")
      .map((func: ABIDefinition) => {
        const name = `${func.name}(${func.inputs ? func.inputs.map((input) => input.type).join(",") : ""})`;
        funcSignatures[sha3(name).substring(0, 10)] = {
          abi: func,
          functionName: func.name,
          name,
        };
      });

    addressToContract[address] = {
      functions: funcSignatures,
      name: contract.className,
      silent: contract.silent,
    };
  });
  return addressToContract;
}

export function getTransactionParams(contract: AddressToContract, transactionInput: string): object {
  const func = contract.functions[transactionInput.substring(0, 10)];
  const functionName = func ? func.functionName : "UNKNOWN";

  let paramString = "";
  if (func && func.abi && func.abi.inputs) {
    const decodedParameters = decodeParams(func.abi.inputs, transactionInput.substring(10));
    func.abi.inputs.forEach((input) => {
      const quote = input.type.indexOf("int") === -1 ? '"' : "";
      paramString += quote + decodedParameters[input.name] + quote + ", ";
    });
    paramString = paramString.substring(0, paramString.length - 2);
  }
  return {
    functionName,
    paramString,
  };
}
