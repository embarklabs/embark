import { Contract, Embark } from "embark";
import { CommandOptions, ContractLanguage, Framework } from "./commandOptions";
import { SolidityBuilder } from "./contractLanguage/solidityBuilder";
import { ReactBuilder } from "./framework/reactBuilder";
import { SmartContractsRecipe } from "./smartContractsRecipe";

export default class Scaffolding {

  constructor(private embark: Embark, private options: any) {
    this.embark.events.setCommandHandler("scaffolding:generate:contract", (cmdLineOptions: any,  cb: (files: string[]) => void) => {
      this.generateContract(cmdLineOptions).then(cb);
    });

    this.embark.events.setCommandHandler("scaffolding:generate:ui", (cmdLineOptions: any,  cb: (files: string[]) => void) => {
      this.generateUi(cmdLineOptions).then(cb);
    });
  }

  private contractLanguageStrategy(recipe: SmartContractsRecipe, options: CommandOptions) {
    switch (options.contractLanguage) {
      case ContractLanguage.Solidity: {
        return new SolidityBuilder(this.embark, recipe, options);
      }
    }
  }

  private frameworkStrategy(recipe: SmartContractsRecipe, contracts: Contract[], options: CommandOptions) {
    switch (options.framework) {
      case Framework.React: {
        return new ReactBuilder(this.embark, recipe, contracts, options);
      }
    }
  }

  private parseAndValidate(cmdLineOptions: any) {
    const options = new CommandOptions(this.embark.logger, cmdLineOptions.framework, cmdLineOptions.contractLanguage, cmdLineOptions.overwrite);
    const recipe = new SmartContractsRecipe(this.embark.logger, cmdLineOptions.contractOrFile, cmdLineOptions.fields);
    options.validate();
    recipe.validate();

    return {recipe, options};
  }

  private async generateContract(cmdLineOptions: any) {
    const {recipe, options} = this.parseAndValidate(cmdLineOptions);
    return await this.contractLanguageStrategy(recipe, options).build();
  }

  private async generateUi(cmdLineOptions: any) {
    const {recipe, options} = this.parseAndValidate(cmdLineOptions);
    const contracts = await this.getContracts();
    return await this.frameworkStrategy(recipe, contracts, options).build();
  }

  private getContracts() {
    return new Promise<Contract[]>((resolve) => {
      this.embark.events.request("contracts:list", (_: null, contracts: Contract[]) => {
        resolve(contracts);
      });
    });
  }
}
