import { AbiItem } from "web3-utils";

export interface Contract {
  abiDefinition: AbiItem[];
  deployedAddress: string;
  className: string;
  silent?: boolean;
}
