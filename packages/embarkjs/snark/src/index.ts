import EmbarkJsSnark from "./embarkjs-snark";
export default EmbarkJsSnark;
export type SnarksProtocol = 'original' | 'groth' | 'kimleeoh';

export interface CircuitConfig {
  protocol?: SnarksProtocol;
  exclude?: boolean;
}

export interface PluginConfig {
  circuits: string[];
  circuitsConfig: {
    [key: string]: CircuitConfig;
  };
  buildDir: string;
  buildDirUrl: string;
  contractsBuildDir: string;
  contractsJsonDirUrl: string;
}

export interface CircuitSetup {
  provingKey?: string;
  verificationKey?: string;
  compiledCircuit?: string;
  config: CircuitConfig;
  filepath: string;
  name: string;
  verifierContractName?: string;
  verificationContract?: any;
}
