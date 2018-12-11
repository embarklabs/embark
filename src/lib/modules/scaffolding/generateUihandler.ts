import { ScaffoldGenerateUi } from "../../../commands";
import { Contract } from "../../../types/contract";
import { Embark } from "../../../types/embark";
import { CommandOptions, Framework } from "./commandOptions";
import { ReactBuilder } from "./framework/reactBuilder";
import { SmartContractsRecipe } from "./smartContractsRecipe";

export class GenerateUiHandler {
  constructor(private embark: Embark) {}

  public async next(command: ScaffoldGenerateUi) {
    const {recipe, options} = this.parseAndValidate(command.payload.options);
    const contracts = await this.getContracts();
    await this.frameworkStrategy(recipe, contracts, options).build();
    command.payload.done();
  }

  public error(error: Error) {
    throw error;
  }

  public complete() {}

  private parseAndValidate(cmdLineOptions: any) {
    const options = new CommandOptions(this.embark.logger, cmdLineOptions.framework, cmdLineOptions.contractLanguage, cmdLineOptions.overwrite);
    const recipe = new SmartContractsRecipe(this.embark.logger, cmdLineOptions.contractOrFile, cmdLineOptions.fields);
    options.validate();
    recipe.validate();

    return {recipe, options};
  }

  private frameworkStrategy(recipe: SmartContractsRecipe, contracts: Contract[], options: CommandOptions) {
    switch (options.framework) {
      case Framework.React: {
        return new ReactBuilder(this.embark, recipe, contracts, options);
      }
    }
  }

  private getContracts() {
    return new Promise<Contract[]>((resolve) => {
      this.embark.events.request("contracts:list", (_: null, contracts: Contract[]) => {
        resolve(contracts);
      });
    });
  }

}
