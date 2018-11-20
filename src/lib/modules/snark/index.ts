import { exec } from "child_process";
import globule from "globule";
import * as path from "path";
import * as zkSnark from "snarkjs";
import { CircuitsConfig, Embark } from "../../../typings/embark";
import { EmbarkConfig } from "../../../typings/embarkConfig";
import { Logger } from "../../../typings/logger";

const fs = require("../../core/fs");

zkSnark.bigInt.prototype.toJSON = function() { return this.toString(); };
const circomBinary = path.join(__dirname, "../../../../node_modules/.bin/circom");
const snarkjsBinary = path.join(__dirname, "../../../../node_modules/.bin/snarkjs");

enum Extension {
  Json = ".json",
  Circom = ".circom",
  VkProof = ".vk_proof",
  VkVerifier = ".vk_verifier",
  Solidity = ".sol",
}

export default class Snark {
  private readonly embarkConfig: EmbarkConfig;
  private readonly compiledCircuitsPath: string;
  private readonly circuitsConfig: CircuitsConfig;
  private readonly logger: Logger;

  constructor(private readonly embark: Embark, private readonly options: object) {
    this.logger = embark.logger;
    this.circuitsConfig = embark.config.circuitsConfig;

    this.embarkConfig = fs.readJSONSync(path.join(fs.dappPath(), "embark.json"));
    this.compiledCircuitsPath = path.join(fs.dappPath(), ".embark", "snarks");

    fs.ensureDirSync(this.compiledCircuitsPath);
    this.embark.registerActionForEvent("build:beforeAll", this.compileAndGenerateContracts.bind(this));
  }

  private readonly compileAndGenerateContracts = async (callback: () => void) => {
    try {
      await Promise.all(this.compileCircuits());
      await Promise.all(this.generateProofs());
      this.addVerifiersToContracts();
      callback();
    } catch (error) {
      console.error(error);
      callback();
    }
  }

  private readonly compileCircuits = () => {
    const patterns = this.embarkConfig.circuits;
    if (!patterns) {
      return [];
    }

    this.logger.info("Compiling circuits...");
    return patterns.reduce((promises: Array<Promise<void>>, pattern) => {
      const filepaths = globule.find(pattern);
      const newPromises = filepaths.filter((filename) => path.extname(filename) === Extension.Circom)
                                   .map((filepath) => this.compileCircuit(filepath));
      return promises.concat(newPromises);
    }, []);
  }

  private readonly compileCircuit = (filepath: string) => {
    return new Promise<void>((resolve, reject) => {
      const output = path.join(this.compiledCircuitsPath, `${path.basename(filepath, Extension.Circom)}${Extension.Json}`);
      exec(`${circomBinary} ${filepath} -o ${output}`, (error) => {
        if (error) {
          return reject(error);
        }

        resolve();
      });
    });
  }

  private readonly generateProofs = () => {
    this.logger.info("Generating proofs...");

    return fs.readdirSync(this.compiledCircuitsPath)
             .filter((filename: string) => path.extname(filename) === Extension.Json)
             .map(this.generateProof);
  }

  private readonly generateProof = (filename: string) => {
    const filepath = path.join(this.compiledCircuitsPath, filename);
    const basename = path.basename(filename, Extension.Json);

    const circuit = this.getCircuit(filepath);
    const setup = this.generateSetup(circuit, basename);

    const input = this.circuitsConfig.circuits[basename];
    if (!input) {
      return new Promise<void>((resolve) => resolve());
    }

    const witness = circuit.calculateWitness(input);
    const {proof, publicSignals} = zkSnark.original.genProof(setup.vk_proof, witness);
    if (zkSnark.original.isValid(setup.vk_verifier, proof, publicSignals)) {
      return this.generateVerifier(basename);
    } else {
      throw new Error(`The proof is not valid for ${basename} with inputs: ${JSON.stringify(input)}`);
    }
  }

  private readonly getCircuit = (filepath: string) => {
    const definition = JSON.parse(fs.readFileSync(filepath, "utf8"));
    return new zkSnark.Circuit(definition);
  }

  private readonly generateSetup = (circuit: object, basename: string) => {
    const setup = zkSnark.original.setup(circuit);
    fs.writeFileSync(this.proofFilepath(basename), JSON.stringify(setup.vk_proof), "utf8");
    fs.writeFileSync(this.verifierFilepath(basename), JSON.stringify(setup.vk_verifier), "utf8");

    return setup;
  }

  private readonly generateVerifier = (basename: string) => {
    return new Promise<void>((resolve, reject) => {
      const source = this.verifierFilepath(basename);
      const output = this.verifierContractPath(basename);
      exec(`${snarkjsBinary} generateverifier --vk ${source} -v ${output}`, (error) => {
        if (error) {
          return reject(error);
        }

        resolve();
      });
    });
  }

  private readonly addVerifiersToContracts = () => {
    fs.readdirSync(this.compiledCircuitsPath)
      .filter((filename: string) => path.extname(filename) === Extension.Solidity)
      .map(this.addVerifierToContracts);
  }

  private readonly addVerifierToContracts = (filename: string) => {
    this.embark.events.request("config:contractsFiles:add",  path.join(this.compiledCircuitsPath, filename));
  }

  private readonly verifierFilepath = (basename: string) => path.join(this.compiledCircuitsPath, `${basename}${Extension.VkVerifier}`);

  private readonly verifierContractPath = (basename: string) => path.join(this.compiledCircuitsPath, `${basename}${Extension.Solidity}`);

  private readonly proofFilepath = (basename: string) => path.join(this.compiledCircuitsPath, `${basename}${Extension.VkProof}`);

}
