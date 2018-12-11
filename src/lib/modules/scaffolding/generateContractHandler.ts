import { ScaffoldGenerateContracts } from "../../../commands";
import { Embark } from "../../../types/embark";
import { CommandOptions, ContractLanguage } from "./commandOptions";
import { SolidityBuilder } from "./contractLanguage/solidityBuilder";
import { SmartContractsRecipe } from "./smartContractsRecipe";

export class GenerateContractHandler {
  constructor(private embark: Embark) {}

  public async next(command: ScaffoldGenerateContracts) {
    const {recipe, options} = this.parseAndValidate(command.payload.options);
    const files =  await this.contractLanguageStrategy(recipe, options).build();
    command.payload.done(files);
  }

  public error(error: Error) {
    throw error;
  }

  public complete() {}

  private contractLanguageStrategy(recipe: SmartContractsRecipe, options: CommandOptions) {
    switch (options.contractLanguage) {
      case ContractLanguage.Solidity: {
        return new SolidityBuilder(this.embark, recipe, options);
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
}