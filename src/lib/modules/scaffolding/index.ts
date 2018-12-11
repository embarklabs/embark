import { ScaffoldGenerateContracts, ScaffoldGenerateUi } from "../../../commands";
import { Embark } from "../../../types/embark";
import { GenerateContractHandler } from "./generateContractHandler";
import { GenerateUiHandler } from "./generateUiHandler";

export default class Scaffolding {
  constructor(embark: Embark, options: any) {
    embark.events.observe<ScaffoldGenerateContracts>(ScaffoldGenerateContracts).subscribe(new GenerateContractHandler(embark));
    embark.events.observe<ScaffoldGenerateUi>(ScaffoldGenerateUi).subscribe(new GenerateUiHandler(embark));
  }
}
