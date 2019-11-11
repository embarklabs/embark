import Ajv from "ajv";
import { __ } from "embark-i18n";
import { Logger } from 'embark-logger';

export enum Framework {
  React = "react",
}

export enum ContractLanguage {
  Solidity = "solidity",
}

export class CommandOptions {
  constructor(private readonly logger: Logger,
              public readonly framework: Framework = Framework.React,
              public readonly contractLanguage: ContractLanguage = ContractLanguage.Solidity,
              public readonly overwrite: boolean = false,
             ) {
  }

  public validate() {
    if (!Object.values(Framework).includes(this.framework)) {
      this.logger.error(__("Selected framework not supported"));
      this.logger.error(__("Supported Frameworks are: %s", Object.values(Framework).join(", ")));
      process.exit(1);
    }
    if (!Object.values(ContractLanguage).includes(this.contractLanguage)) {
      this.logger.error(__("Selected contract language not supported"));
      this.logger.error(__("Supported Contract Languages are: %s", Object.values(ContractLanguage).join(", ")));
      process.exit(1);
    }
  }
}
