import { Embark, EmbarkEvents } from 'embark-core';
import { File, Types as FileTypes } from 'embark-utils';
import { Logger } from 'embark-logger';
import { exec } from 'child_process';
import { sync as findUp } from 'find-up';
import globCb from 'glob';
import * as path from 'path';
import * as zkSnark from 'snarkjs';
import { promisify } from 'util';
import { PluginConfig, CircuitConfig, CircuitSetup } from 'embarkjs-snark';
import compileCircuit from "circom";
import SetupTracker from "./setupTracker";

const glob = promisify(globCb);
const LOG_PREFIX = '[embark-snark]: ';
const STACK_NAME = "Snarks";
const MODULE_NAME = "zk";

// tslint:disable-next-line: space-before-function-paren
zkSnark.bigInt.prototype.toJSON = function () {
  return this.toString();
};

export class Snarks {
  private config: PluginConfig;
  private logger: Logger;
  private fs: any;
  private events: EmbarkEvents;
  private circuitSetups: CircuitSetup[] = [];
  private setupTracker: any = {};
  private outputPath: string;
  private buildDir: string;
  private contractsBuildDir: string;
  constructor(private embark: Embark) {
    this.outputPath = embark.config.dappPath(".embark", "snarks");
    this.config = embark.pluginConfig;
    this.buildDir = embark.config.dappPath(this.config.buildDir) || this.outputPath;
    this.contractsBuildDir = embark.config.dappPath(this.config.contractsBuildDir) || this.outputPath;
    this.fs = embark.fs;
    this.logger = embark.logger;
    this.events = embark.events;

    if (!this.config) {
      this.logger.warn(
        `${LOG_PREFIX}Plugin config for 'embark-snark' not found. Please add a 'plugins.embark-snark' section to 'embark.json'.`
      );
      return;
    }

    this.setupTracker = new SetupTracker(this.fs, this.outputPath);

    this.registerEvents();
    this.init();
  }

  static Extensions = {
    Json: '.json',
    Circom: '.circom',
    VkProof: '.vk_proof',
    VkVerifier: '.vk_verifier',
    Solidity: '.sol'
  };

  static snarkjsBinary = findUp('node_modules/.bin/snarkjs', {
    cwd: __dirname
  });

  registerEvents() {
    this.embark.registerActionForEvent('pipeline:generateAll:before', { priority: 40 }, this.setupEmbarkJs.bind(this));
    this.embark.registerActionForEvent('compiler:contracts:compile:before', this.compileAndGenerateContracts.bind(this));
  }

  async init() {
    const patterns = this.config.circuits;
    if (!patterns || !patterns.length) {
      this.logger.warn(`${LOG_PREFIX}No circuits defined. Please add 'circuits' glob pattern to embark.json.`);
      return;
    }

    for (const pattern of patterns) {
      const filepaths =
        (await glob(pattern))
          .filter(filename => path.extname(filename) === Snarks.Extensions.Circom);

      for (const filepath of filepaths) {
        const name = path.basename(filepath, Snarks.Extensions.Circom);
        const config = this.circuitsConfig(name);
        this.circuitSetups.push({ name, filepath, config });
      }
    }

    if (!this.circuitSetups.length) {
      this.logger.warn(`${LOG_PREFIX}No circuits found in ${JSON.stringify(patterns)}. Nothing to do.`);
    }
  }

  getCircularReplacer() {
    const seen = new WeakSet();
    return (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) {
          return;
        }
        seen.add(value);
      }
      return value;
    };
  }

  async setupEmbarkJs(_params, cb) {
    const consoleCode = `
    const embarkjsSnark = require('embarkjs-snark').default;
    const setups = ${JSON.stringify(this.circuitSetups)};
    for (const setup of setups) {
      if (setup.config.exclude) {
        continue;
      }
      setup.verificationContract = eval(setup.verifierContractName);
    }
    EmbarkJS.Snark = new embarkjsSnark(setups);
    try {
      await EmbarkJS.Snark.init();
    } catch (err) {
      console.error("Failed to initialize EmbarkJS.Snark: ", err);
    }
    `;
    const embarkJsCode = `
        const embarkjsSnark = require('embarkjs-snark').default;
        const setups = ${JSON.stringify(this.circuitSetups, this.getCircularReplacer())};
        const pluginConfig = ${JSON.stringify(this.config)};
        EmbarkJS.Snark = new embarkjsSnark(setups, pluginConfig);
        EmbarkJS.Snark.init().then(() => {
          console.log("EmbarkJS.Snark initialized");
        }).catch((err) => {
          console.error("Failed to initialize EmbarkJS.Snark: ", err);
        });
      `;
    await this.events.request2("runcode:whitelist", "embarkjs-snark");
    await Promise.all([
      this.events.request2("embarkjs:plugin:register:custom", STACK_NAME, MODULE_NAME, embarkJsCode),
      this.events.request2("runcode:eval", consoleCode)
    ]);
    cb();
  }

  circuitsConfig(basename) {
    const defaultConfig: CircuitConfig = {
      protocol: "groth",
      exclude: false
    };

    if (!this.config.circuitsConfig) {
      this.config.circuitsConfig = {};
    }

    if (!this.config.circuitsConfig[basename]) {
      this.config.circuitsConfig[basename] = {};
    }

    return { ...defaultConfig, ...this.config.circuitsConfig[basename] };
  }

  async compileCircuit(filepath) {
    const compiledCircuitPath = path.join(
      this.buildDir,
      `${path.basename(filepath, Snarks.Extensions.Circom)}${
      Snarks.Extensions.Json
      }`
    );
    const compiledCircuit = await compileCircuit(filepath);
    await this.fs.writeJson(compiledCircuitPath, compiledCircuit);
    return { compiledCircuit, compiledCircuitPath };
  }

  buildFilepath(basename, ext: string) {
    return path.join(
      this.buildDir,
      `${basename}${ext}`
    );
  }

  makeRelative(filepath): string {
    return filepath.replace(`${this.embark.config.dappPath()}/`, "");
  }

  async generateSetup(name: string, config: CircuitConfig, compiledCircuit: any): Promise<{ vkPath: string, pkPath: string; }> {
    const zkCircuit = new zkSnark.Circuit(compiledCircuit);
    const circuitHasChanged = await this.setupTracker.hasChanged(name, config, compiledCircuit);
    const vkPath = this.buildFilepath(name, Snarks.Extensions.VkVerifier);
    const pkPath = this.buildFilepath(name, Snarks.Extensions.VkProof);
    const [vkExists, pkExists] = await Promise.all([
      this.fs.pathExists(vkPath),
      this.fs.pathExists(pkPath)
    ]);
    if (!circuitHasChanged && vkExists && pkExists) {
      this.logger.info(`${LOG_PREFIX}Using existing circuit setup for '${name}'`);
      return { vkPath, pkPath };
    }

    this.logger.info(`${LOG_PREFIX}Grab a coffee ☕️  this could take quite a while...`);
    const setup = zkSnark[config.protocol].setup(zkCircuit);
    delete setup.toxic; // must discard toxic lambda

    await Promise.all([
      this.fs.writeJson(vkPath, setup.vk_verifier),
      this.fs.writeJson(pkPath, setup.vk_proof)
    ]);

    await this.setupTracker.update(name, config, compiledCircuit);

    return { vkPath, pkPath };
  }

  async getCircuit(filepath) {
    const definition = JSON.parse(await this.fs.readFile(filepath, 'utf8'));
    return new zkSnark.Circuit(definition);
  }

  generateVerifier(name: string): Promise<{ contractPath: string, contractName: string; }> {
    return new Promise((resolve, reject) => {
      const vk = this.buildFilepath(name, Snarks.Extensions.VkVerifier);
      const contractPath = path.join(
        this.contractsBuildDir,
        `${name}${Snarks.Extensions.Solidity}`
      );
      exec(
        `${Snarks.snarkjsBinary} generateverifier --vk ${vk} -v ${contractPath}`,
        async error => {
          if (error) {
            return reject(error);
          }

          const circuitName = name.charAt(0).toUpperCase() + name.substr(1).toLowerCase();
          const contractName = `${circuitName}Verifier`;
          let solidityOutput = await this.fs.readFile(contractPath, 'utf8');
          solidityOutput = solidityOutput.replace("contract Verifier", `contract ${contractName}`);
          await this.fs.writeFile(
            contractPath,
            solidityOutput,
            'utf8'
          );

          resolve({ contractPath, contractName });
        }
      );
    });
  }

  async compileAndGenerateContracts(contractFiles: File[], callback) {
    try {
      const circuits = this.circuitSetups
        .filter((circuit) => circuit.config.exclude !== true);

      await Promise.all([
        await this.fs.ensureDir(this.buildDir),
        await this.fs.ensureDir(this.contractsBuildDir)
      ]);

      for (const circuit of circuits) {
        this.logger.info(`${LOG_PREFIX}Compiling circuit '${circuit.name}'...`);
        const { compiledCircuit, compiledCircuitPath } = await this.compileCircuit(circuit.filepath);
        circuit.compiledCircuit = this.makeRelative(compiledCircuitPath);

        this.logger.info(`${LOG_PREFIX}Generating '${circuit.name}' zkSnarks setup...`);
        const { vkPath, pkPath } = await this.generateSetup(circuit.name, circuit.config, compiledCircuit);
        circuit.verificationKey = this.makeRelative(vkPath);
        circuit.provingKey = this.makeRelative(pkPath);

        this.logger.info(`${LOG_PREFIX}Generating '${circuit.name}' verification contract...`);
        const { contractPath, contractName } = await this.generateVerifier(circuit.name);
        const contractFile = new File({
          type: FileTypes.dappFile,
          path: this.makeRelative(contractPath)
        });
        contractFiles.push(contractFile);
        circuit.verifierContractName = contractName;
      }
    } catch (error) {
      return callback(error);
    }
    callback(null, contractFiles);
  }
}

export default embark => new Snarks(embark);
