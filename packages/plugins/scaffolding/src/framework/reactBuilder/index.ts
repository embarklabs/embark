import { Contract, Embark } from "embark-core";
import { __ } from "embark-i18n";
import Handlebars from "handlebars";
import * as path from "path";
import { AbiItem } from "web3-utils";
import { Builder } from "../../builder";
import { CommandOptions } from "../../commandOptions";
import { SmartContractsRecipe } from "../../smartContractsRecipe";

const utils = require("embark-utils");
require("../../handlebarHelpers");

interface AbiItemDecorated extends AbiItem {
  isIpfsText?: boolean;
  isIpfsFile?: boolean;
  isStandard?: boolean;
}

const indexTemplatePath = path.join(__dirname, "templates", "index.html.hbs");
const dappTemplatePath = path.join(__dirname, "templates", "dapp.js.hbs");

export class ReactBuilder implements Builder {
  constructor(private embark: Embark,
              private description: SmartContractsRecipe,
              private contracts: Contract[],
              private options: CommandOptions) {
  }

  public async build() {
    await this.installDependencies();

    const arr: string[] = [];
    return arr.concat(
      ...Object.keys(this.description.data).map((contractName) => {
        const [indexCode, dappCode] = this.generateCodes(contractName);
        if (indexCode && dappCode) {
          const files = this.saveFiles(contractName, indexCode, dappCode);
          this.updateEmbarkJson(contractName, files);
          return files;
        } else {
          return [];
        }
      }),
    );
  }

  private updateEmbarkJson(contractName: string, files: string[]) {
    const embarkJsonPath = path.join(utils.dappPath(), "embark.json");
    let embarkJson;
    try {
      embarkJson = this.embark.fs.readJSONSync(embarkJsonPath);
    } catch (e) {
      throw new Error('No embark.json file found. Add an embark.json file to use the scaffold command.');
    }
    embarkJson.app[`${contractName}.js`] = `app/${contractName}.js`;
    embarkJson.app[`${contractName}.html`] = `app/${contractName}.html`;

    this.embark.fs.writeFileSync(embarkJsonPath, JSON.stringify(embarkJson, null, 2));
  }

  private generateCodes(contractName: string) {
    const indexSource = this.embark.fs.readFileSync(indexTemplatePath, "utf-8");
    const dappSource = this.embark.fs.readFileSync(dappTemplatePath, "utf-8");

    const indexTemplate = Handlebars.compile(indexSource);
    const dappTemplate = Handlebars.compile(dappSource);

    const indexData = {
      filename: contractName,
      title: contractName,
    };

    const contract = this.contracts.find((c) => c.className === contractName);
    if (!contract) {
      return [];
    }

    const relativeGenerationDir = path.relative(
      utils.dappPath('app'),
      utils.dappPath(this.embark.config.embarkConfig.generationDir)
    );

    const dappData = {
      contractName,
      functions: this.getFunctions(contract),
      relativeGenerationDir
    };

    return [indexTemplate(indexData), dappTemplate(dappData)];
  }

  private getFunctions(contract: Contract) {
    const ipfsAttributes = this.description.ipfsAttributes(contract.className);

    return contract.abiDefinition.filter((entry) => entry.type === "function").map((entry) => {
      const decorated: AbiItemDecorated = entry;
      const inputName = entry.inputs && entry.inputs.length > 1 ? entry.inputs[1].name.substring(1, entry.inputs[1].name.length) : "";
      const functionName = entry.name || "";

      Object.keys(ipfsAttributes).forEach((name) => {
        let text = false;
        if (ipfsAttributes[name] === "ipfsText") {
          text = true;
        }

        let ipfs = false;
        if (name === inputName || `get${name.charAt(0).toUpperCase() + name.slice(1)}` === functionName) {
          ipfs = true;
        }

        if (ipfs) {
          if (text) {
            decorated.isIpfsText = true;
          } else {
            decorated.isIpfsFile = true;
          }
        }
      });

      if (!decorated.isIpfsText && !decorated.isIpfsFile) {
        decorated.isStandard = true;
      }

      return decorated;
    });
  }

  private installDependencies() {
    let pkgManager = 'npm install';
    if (this.embark.fs.existsSync(utils.dappPath('yarn.lock'))) {
      pkgManager = 'yarn add';
    }
    const cmd = `${pkgManager} react react-bootstrap@^0.33.1 react-dom`;
    return new Promise<void>((resolve, reject) => {
      utils.runCmd(cmd, null, (error: string) => {
        if (error) {
          return reject(new Error(error));
        }

        resolve();
      });
    });
  }

  private saveFiles(contractName: string, indexCode: string, dappCode: string) {
    const indexFilePath = path.join(utils.dappPath(), "app", `${contractName}.html`);
    const dappFilePath = path.join(utils.dappPath(), "app", `${contractName}.js`);

    if (!this.options.overwrite && (this.embark.fs.existsSync(indexFilePath) || this.embark.fs.existsSync(dappFilePath))) {
      return [];
    }

    this.embark.fs.writeFileSync(indexFilePath, indexCode);
    this.embark.fs.writeFileSync(dappFilePath, dappCode);

    this.embark.logger.info(__(`${indexFilePath} generated`));
    this.embark.logger.info(__(`${dappFilePath} generated`));
    return [indexFilePath, dappFilePath];
  }
}
