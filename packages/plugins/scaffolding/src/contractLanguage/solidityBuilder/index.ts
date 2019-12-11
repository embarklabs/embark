import { Embark } from "embark-core";
import { __ } from "embark-i18n";
import { dappPath } from "embark-utils";
import Handlebars from "handlebars";
import * as path from "path";
import { Builder } from "../../builder";
import { CommandOptions } from "../../commandOptions";
import { SmartContractsRecipe } from "../../smartContractsRecipe";

require("../../handlebarHelpers");

const templatePath = path.join(__dirname, "templates", "contract.sol.hbs");

export class SolidityBuilder implements Builder {
  constructor(private embark: Embark,
              private description: SmartContractsRecipe,
              private options: CommandOptions) {
  }

  public async build() {
    return Object.keys(this.description.data).map((contractName) => {
      const code = this.generateCode(contractName);
      const file = this.saveFile(contractName, code);
      this.printInstructions(contractName);
      return file;
    });
  }

  private generateCode(contractName: string) {
    const source = this.embark.fs.readFileSync(templatePath, "utf-8");
    const template = Handlebars.compile(source);

    const attributes = this.description.standardAttributes(contractName);
    const ipfs = this.description.ipfsAttributes(contractName);
    const associations = this.description.associationAttributes(contractName);

    const data = {
      associations,
      attributes,
      contractName,
      ipfs,
      structName: `${contractName}Struct`,
    };

    return template(data);
  }

  private saveFile(contractName: string, code: string) {
    const filename = `${contractName}.sol`;
    const contractDirs = this.embark.config.embarkConfig.contracts;
    const contractDir = Array.isArray(contractDirs) ? contractDirs[0] : contractDirs;
    const filePath = dappPath(contractDir.replace(/\*/g, ""), filename);
    if (!this.options.overwrite && this.embark.fs.existsSync(filePath)) {
      this.embark.logger.error(__(`The contract ${contractName} already exists, skipping.`));
      return;
    }

    this.embark.fs.writeFileSync(filePath, code);
    return filePath;
  }

  private printInstructions(contractName: string) {
    const associations = Object.keys(this.description.associationAttributes(contractName));
    if (!associations.length) {
      return;
    }

    const args = associations.map((name) => `"$${name}"`).join(", ");
    this.embark.logger.info(`In order to deploy your contracts, you will have to specify the dependencies.`);
    this.embark.logger.info(`You can do it by adding to your contracts config the following snippets:`);
    this.embark.logger.info(`${contractName}: { args: [${args}] }`);
  }
}
