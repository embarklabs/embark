import { exec } from 'child_process';
import { sync as findUp } from 'find-up';
import globCb from 'glob';
import * as path from 'path';
import * as zkSnark from 'snarkjs';
import { promisify } from 'util';

const glob = promisify(globCb);

zkSnark.bigInt.prototype.toJSON = function() {
  return this.toString();
};

export class Snarks {
  constructor(embark) {
    this.embark = embark;
    this.circuitsConfig = embark.pluginConfig;
    this.compiledCircuitsPath = embark.config.dappPath('.embark', 'snarks');
    this.fs = embark.fs;
    this.logger = embark.logger;

    if (this.circuitsConfig) {
      this.registerEvents();
    }
  }

  static Extensions = {
    Json: '.json',
    Circom: '.circom',
    VkProof: '.vk_proof',
    VkVerifier: '.vk_verifier',
    Solidity: '.sol'
  };

  static circomBinary = findUp('node_modules/.bin/circom', { cwd: __dirname });
  static snarkjsBinary = findUp('node_modules/.bin/snarkjs', {
    cwd: __dirname
  });

  registerEvents() {
    this.embark.registerActionForEvent(
      'compiler:contracts:compile:before',
      this.compileAndGenerateContracts.bind(this)
    );
  }

  verifierFilepath(basename) {
    return path.join(
      this.compiledCircuitsPath,
      `${basename}${Snarks.Extensions.VkVerifier}`
    );
  }

  verifierContractPath(basename) {
    return path.join(
      this.compiledCircuitsPath,
      `${basename}${Snarks.Extensions.Solidity}`
    );
  }

  proofFilepath(basename) {
    return path.join(
      this.compiledCircuitsPath,
      `${basename}${Snarks.Extensions.VkProof}`
    );
  }

  async compileCircuits() {
    await this.fs.ensureDir(this.compiledCircuitsPath);

    const patterns = this.circuitsConfig.circuits;
    if (!patterns || !patterns.length) {
      return;
    }

    this.logger.info('Compiling circuits...');

    await Promise.all(
      patterns.map(async pattern => {
        const filepaths = await glob(pattern);
        await Promise.all(
          filepaths
            .filter(
              filename => path.extname(filename) === Snarks.Extensions.Circom
            )
            .map(filepath => this.compileCircuit(filepath))
        );
      })
    );
  }

  compileCircuit(filepath) {
    return new Promise((resolve, reject) => {
      const output = path.join(
        this.compiledCircuitsPath,
        `${path.basename(filepath, Snarks.Extensions.Circom)}${
          Snarks.Extensions.Json
        }`
      );
      exec(`${Snarks.circomBinary} ${filepath} -o ${output}`, error => {
        if (error) {
          return reject(error);
        }

        resolve();
      });
    });
  }

  async generateProofs() {
    this.logger.info('Generating proofs...');

    await Promise.all(
      (await this.fs.readdir(this.compiledCircuitsPath))
        .filter(filename => path.extname(filename) === Snarks.Extensions.Json)
        .map(filename => this.generateProof(filename))
    );
  }

  async generateProof(filename) {
    const filepath = path.join(this.compiledCircuitsPath, filename);
    const basename = path.basename(filename, Snarks.Extensions.Json);

    const circuit = await this.getCircuit(filepath);
    const setup = await this.generateSetup(circuit, basename);

    const input = this.circuitsConfig.inputs[basename];
    if (!input) {
      return;
    }

    const witness = circuit.calculateWitness(input);
    const { proof, publicSignals } = zkSnark.original.genProof(
      setup.vk_proof,
      witness
    );
    if (!zkSnark.original.isValid(setup.vk_verifier, proof, publicSignals)) {
      throw new Error(
        `The proof is not valid for ${basename} with inputs: ${JSON.stringify(
          input
        )}`
      );
    }

    return this.generateVerifier(basename);
  }

  async getCircuit(filepath) {
    const definition = JSON.parse(await this.fs.readFile(filepath, 'utf8'));
    return new zkSnark.Circuit(definition);
  }

  async generateSetup(circuit, basename) {
    const setup = zkSnark.original.setup(circuit);
    await Promise.all([
      this.fs.writeFile(
        this.proofFilepath(basename),
        JSON.stringify(setup.vk_proof),
        'utf8'
      ),
      this.fs.writeFile(
        this.verifierFilepath(basename),
        JSON.stringify(setup.vk_verifier),
        'utf8'
      )
    ]);

    return setup;
  }

  generateVerifier(basename) {
    return new Promise((resolve, reject) => {
      const source = this.verifierFilepath(basename);
      const output = this.verifierContractPath(basename);
      exec(
        `${Snarks.snarkjsBinary} generateverifier --vk ${source} -v ${output}`,
        error => {
          if (error) {
            return reject(error);
          }

          resolve();
        }
      );
    });
  }

  async addVerifiersToContracts(contractFiles) {
    (await this.fs.readdir(this.compiledCircuitsPath))
      .filter(filename => path.extname(filename) === Snarks.Extensions.Solidity)
      .map(filename => this.addVerifierToContracts(filename, contractFiles));
  }

  addVerifierToContracts(filename, contractFiles) {
    filename = path.join(this.compiledCircuitsPath, filename);
    contractFiles.push({ path: filename });
  }

  async compileAndGenerateContracts(contractFiles, callback) {
    try {
      await this.compileCircuits();
      await this.generateProofs();
      await this.addVerifiersToContracts(contractFiles);
    } catch (error) {
      return callback(error);
    }
    callback(null, contractFiles);
  }
}

export default embark => new Snarks(embark);
