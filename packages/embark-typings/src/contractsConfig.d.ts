export interface ContractsConfig {
  deploy: { [name: string]: ContractConfig }
  gas: string | number;
  tracking: boolean | string;
}

export interface ContractConfig {
  address?: string;
  args?: Array<any>;
  instanceOf?: string;
  gas?: number;
  gasPrice?: number;
  silent?: boolean;
  track?: boolean;
  deploy?: boolean;
}