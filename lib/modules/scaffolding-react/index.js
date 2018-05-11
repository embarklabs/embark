
const Handlebars = require('handlebars');
const fs = require('../../core/fs');

Handlebars.registerHelper('capitalize', function(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
});

Handlebars.registerHelper('ifview', function(stateMutability, options) {
    let result = stateMutability == 'view' || stateMutability == 'pure' || stateMutability == 'constant';
    if (result) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

Handlebars.registerHelper('ifeq', function(elem, value, options){
    if (elem == value) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

Handlebars.registerHelper('iflengthgt', function(arr, val, options) {
    if (arr.length > val) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

Handlebars.registerHelper('emptyname', function(name, index) {
    return name ? name : 'output' + index;
});


Handlebars.registerHelper('methodname', function(abiDefinition, functionName, inputs){
    let funCount = abiDefinition.filter(x => x.name == functionName).length;
    if(funCount == 1){
        return '.' + functionName;
    } else {
        return new Handlebars.SafeString(`['${functionName}(${inputs !== null ? inputs.map(input => input.type).join(',') : '' })']`);
    }
});

class ScaffoldingReact {
    constructor(embark, options){
        this.embark = embark;
        this.options = options;

        this.embark.registerDappGenerator('react', this.build.bind(this));
    }

    _generateFile(contract, templateFilename, extension, data){
        const filename = contract.className.toLowerCase() + '.' + extension;
        const filePath = './app/' + filename;
        if (fs.existsSync(filePath)){
          //  throw new Error("file '" + filePath + "' already exists");
        }

        const templatePath = fs.embarkPath('lib/modules/scaffolding-react/templates/' + templateFilename);
        const source = fs.readFileSync(templatePath).toString();
        const template = Handlebars.compile(source);

        // Write template
        const result = template(data);
        fs.writeFileSync(filePath, result);
    }

    _buildHTML(contract){
        const filename = contract.className.toLowerCase();
        this._generateFile(contract, 'index.html.tpl', 'html',
        {
            'title': contract.className, 
            'filename': filename
        });
    }

    build(contract){
        this._buildHTML(contract);

        const filename = contract.className.toLowerCase();

        this._generateFile(contract, 'dapp.js.tpl', 'js',         
        {
            'title': contract.className,
            'contractName': contract.className,
            'functions': contract.abiDefinition.filter(x => x.type == 'function')
        });

        // Update config
        const contents = fs.readFileSync("./embark.json");
        let embarkJson = JSON.parse(contents);
        embarkJson.app["js/" + filename + ".js"] = "app/" + filename + '.js';
        embarkJson.app[filename + ".html"] = "app/" + filename + '.html';

        fs.writeFileSync("./embark.json", JSON.stringify(embarkJson, null, 4));

        return filename + ".html generated";
    }
}

module.exports = ScaffoldingReact;
