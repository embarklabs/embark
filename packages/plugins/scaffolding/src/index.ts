import { Callback, Contract, Embark } from "embark-core";
import { CommandOptions, ContractLanguage, Framework } from "./commandOptions";
import { SolidityBuilder } from "./contractLanguage/solidityBuilder";
import { ReactBuilder } from "./framework/reactBuilder";
import { SmartContractsRecipe } from "./smartContractsRecipe";

export default class Scaffolding {

  constructor(private embark: Embark, private options: any) {
    this.embark.events.setCommandHandler(
      "scaffolding:generate:contract",
      (cmdLineOptions: any,  cb: Callback<Array<(string|undefined)>>) => {
        this.generateContract(cmdLineOptions)
          .then(files => cb(null, files))
          .catch(cb);
      }
    );

    this.embark.events.setCommandHandler(
      "scaffolding:generate:ui",
      (cmdLineOptions: any,  cb: Callback<string[]>) => {
        this.generateUi(cmdLineOptions)
          .then(files => cb(null, files))
          .catch(cb);
      }
    );
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
    return this.embark.events.request2("contracts:list") as Promise<Contract[]>;
  }
}
