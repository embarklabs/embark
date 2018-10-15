
const Handlebars = require('handlebars');
const fs = require('../../core/fs');

const capitalize = string => string.charAt(0).toUpperCase() + string.slice(1);

class ScaffoldingSolidity {
    constructor(embark, options){
        this.embark = embark;
        this.options = options;
        this.embark.registerDappGenerator('solidity', this.build.bind(this));
    }

    _generateFile(contract, templateFilename, extension, data, overwrite){
        const filename = capitalize(contract.className.toLowerCase()) + '.' + extension;
        const filePath = './contracts/' + filename;
        if (!overwrite && fs.existsSync(filePath)){
            throw new Error("file '" + filePath + "' already exists");
        }

        const templatePath = fs.embarkPath('lib/modules/scaffolding-solidity/templates/' + templateFilename);
        const source = fs.readFileSync(templatePath).toString();
        const template = Handlebars.compile(source);

        // Write template
        const result = template(data);
        fs.writeFileSync(filePath, result);
    }

    build(contract, overwrite, cb){
        try {
            contract.className = capitalize(contract.className);

            const filename = contract.className;

            this._generateFile(contract, 'contract.sol.tpl', 'sol', {
                'contractName': contract.className,
                'structName': contract.className + "Struct",
                'fields': Object.keys(contract.fields).map(f => { 
                    return {name:f, type: contract.fields[f]}; 
                  })
            }, overwrite);
            this.embark.logger.info("contracts/" + filename + ".sol generated"); 

            cb();        
        } catch(error) {
            this.embark.logger.error(error.message);
            process.exit(1);
        }
    }
}

module.exports = ScaffoldingSolidity;
