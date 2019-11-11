import Ajv from "ajv";
import { Logger } from 'embark-logger';
import { __ } from "embark-i18n";
import { schema } from "./schema";
const fs = require("fs");

const ajv = new Ajv();
const scaffoldingSchema = ajv.compile(schema);

interface Properties {
  [propertyName: string]: string;
}

interface Data {
  [contractName: string]: Properties;
}

const ASSOCIATIONS = ["belongsTo", "hasMany"];
const IPFS = ["ipfsText", "ipfsImage"];

export class SmartContractsRecipe {
  public data: Data;
  constructor(private readonly logger: Logger,
              private readonly contractOrFile: string,
              private readonly fields: string[],
             ) {
    if (fs.existsSync(contractOrFile)) {
      this.data = fs.readJSONSync(contractOrFile);
    } else {
      this.data = this.build();
    }
  }

  public standardAttributes(contractName: string): Properties {
    return Object.keys(this.data[contractName]).reduce((acc: Properties, propertyName: string) => {
      const type = this.data[contractName][propertyName];
      if (!ASSOCIATIONS.includes(type) && !IPFS.includes(type)) {
        acc[propertyName] = type;
      }
      return acc;
    }, {});
  }

  public ipfsAttributes(contractName: string): Properties {
    return Object.keys(this.data[contractName]).reduce((acc: Properties, propertyName: string) => {
      const type = this.data[contractName][propertyName];
      if (IPFS.includes(type)) {
        acc[propertyName] = type;
      }
      return acc;
    }, {});
  }

  public associationAttributes(contractName: string): Properties {
    return Object.keys(this.data[contractName]).reduce((acc: Properties, propertyName: string) => {
      const type = this.data[contractName][propertyName];
      if (ASSOCIATIONS.includes(type)) {
        acc[propertyName] = type;
      }
      return acc;
    }, {});
  }

  public validate() {
    if (!scaffoldingSchema(this.data)) {
      this.logger.error(__("The scaffolding schema is not valid:"));
      this.logger.error(ajv.errorsText(scaffoldingSchema.errors));
      process.exit(1);
    }

    const contractNames = Object.keys(this.data);
    contractNames.forEach((contractName) => {
      if (contractName[0] !== contractName[0].toUpperCase()) {
        this.logger.error(__(`${contractName} must be capitalized.`));
        process.exit(1);
      }
      Object.keys(this.associationAttributes(contractName)).forEach((associationName) => {
        if (associationName === contractName) {
          this.logger.error(__(`${contractName} is referring to himself.`));
          process.exit(1);
        }

        if (!contractNames.includes(associationName)) {
          this.logger.error(__(`${contractName} not found. Please make sure it is in the description.`));
          process.exit(1);
        }

        if (Object.keys(this.data[associationName]).includes(contractName)) {
          this.logger.error(__(`${associationName} has a cyclic dependencies with ${contractName}.`));
          process.exit(1);
        }
      });
    });
  }

  private build() {
    return {
      [this.contractOrFile]: this.fields.reduce((acc: Properties, property) => {
        const [name, value] = property.split(":");
        acc[name] = value;
        return acc;
      }, {}),
    };
  }
}
