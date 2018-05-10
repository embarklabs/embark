
const Handlebars = require('handlebars');

const fs = require('../../core/fs');
const utils = require('../../utils/utils');
class ScaffoldingReact {
    constructor(embark, options){
        this.embark = embark;
        this.options = options;
    }

    build(contract){   
        const filename = contract.className.toLowerCase() + '.html';
        const filePath = './app/' + filename;

        if (fs.existsSync(filePath)){
            throw new Error("file '" + filePath + "' already exists");
        }

        const templatePath = fs.embarkPath('lib/modules/scaffolding-react/templates/index.tpl');
        const source = fs.readFileSync(templatePath).toString();
        const template = Handlebars.compile(source);

        let data = { 
            'title': contract.className
        };
        
        // Write template
        const result = template(data);
        fs.writeFileSync(filePath, result);

        return "File '" + filePath + "' created successfully";
    }
}

module.exports = ScaffoldingReact;
