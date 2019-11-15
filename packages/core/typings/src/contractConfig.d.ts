export interface ContractConfig {
  address?: string;
  args?: any[];
  instanceOf?: string;
  gas?: number;
  gasPrice?: number;
  silent?: boolean;
  track?: boolean;
  deploy?: boolean;
}
