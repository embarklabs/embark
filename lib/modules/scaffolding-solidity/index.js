
const Handlebars = require('handlebars');
const fs = require('../../core/fs');
const utils = require('../../utils/utils');

const capitalize = string => string.charAt(0).toUpperCase() + string.slice(1);

class ScaffoldingSolidity {
    constructor(embark, options){
        this.embark = embark;
        this.options = options;
        this.embark.registerDappGenerator('solidity', this.build.bind(this));
    }

    _generateFile(contract, templateFilename, extension, data, overwrite){
        const filename = capitalize(contract.className.toLowerCase()) + '.' + extension;
        const contractDirs = this.embark.config.embarkConfig.contracts;
        const contractDir = Array.isArray(contractDirs) ? contractDirs[0] : contractDirs;
        const filePath = fs.dappPath(contractDir.replace(/\*/g, ''), filename);
        if (!overwrite && fs.existsSync(filePath)){
            throw new Error("file '" + filePath + "' already exists");
        }

        const templatePath = utils.joinPath(__dirname, 'templates/' + templateFilename);
        const source = fs.readFileSync(templatePath).toString();
        const template = Handlebars.compile(source);

        // Write template
      console.dir(data);
        const result = template(data);
        fs.writeFileSync(filePath, result);
        return filePath;
    }

    build(contract, overwrite, cb){
        try {
            contract.className = capitalize(contract.className);

            const filename = contract.className;

            const filePath = this._generateFile(contract, 'contract.sol.hbs', 'sol', {
                'contractName': contract.className,
                'structName': contract.className + "Struct",
                'fields': Object.keys(contract.fields).map(f => { 
                    return {name:f, type: contract.fields[f]}; 
                  })
            }, overwrite);
            this.embark.logger.info("contracts/" + filename + ".sol generated"); 

            cb(null, filePath);
        } catch(error) {
            this.embark.logger.error(error.message);
            process.exit(1);
        }
    }
}

module.exports = ScaffoldingSolidity;
