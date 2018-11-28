import { ABIDefinition } from "web3/eth/abi";

export interface Contract {
  abiDefinition: ABIDefinition[];
  className: string;
}
