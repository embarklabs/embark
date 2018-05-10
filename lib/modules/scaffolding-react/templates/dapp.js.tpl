import EmbarkJS from 'Embark/EmbarkJS';
import {{contractName}} from 'Embark/contracts/{{contractName}}';

import React from 'react';
import ReactDOM from 'react-dom';
import { FormGroup, ControlLabel, FormControl, Button } from 'react-bootstrap';


{{#each functions}}
class {{capitalize name}}_{{@index}}_Form extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            {{#if inputs.length}}
            input: {
                {{#each inputs}}
                {{name}}: ''{{#unless @last}},{{/unless}}
                {{/each}}
            },
            {{/if}}
            {{#ifview stateMutability}}
            output: null,
            {{/ifview}}
            message: ''
        };
    }

    handleChange(e, name){
        this.state[name] = e.target.value;
        this.setState(this.state);
    }

    async handleClick(e){
        e.preventDefault();

        {{#ifview stateMutability}}
        this.setState({output: null});

        let result = await {{../contractName}}.methods{{methodname ../functions name inputs}}({{#each inputs}}this.state.{{name}}{{#unless @last}}, {{/unless}}{{/each}}).call();
        {{#ifarrlengthgt outputs 1}}
        this.setState({output: {
        {{#each outputs}}
            {{emptyname name @index}}: result[{{@index}}]{{#unless @last}},{{/unless}}
        {{/each}}
        }}); 
        {{else}}
        this.setState({output: result});  
        {{/ifarrlengthgt}} 



        // TODO show on screen
        {{/ifview}}

        // TODO validate
    }

    render(){
        return <div className="formSection">
            <h3>{{name}}</h3>
            <form>
            {{#if inputs.length}}
                {{#each inputs}}
                    <FormGroup>
                        <ControlLabel>{{name}}</ControlLabel>
                        <FormControl
                            type="text"
                            defaultValue={ this.state.input.{{name}} }
                            placeholder="{{type}}"
                            onChange={(e) => this.handleChange(e, '{{name}}')}
                        />
                    </FormGroup>
                {{/each}}      
            {{/if}}
            {{#ifview stateMutability}}
                <Button type="submit" bsStyle="primary" onClick={(e) => this.handleClick(e)}>Call</Button>
                {
                    this.state.output != null ?
                    <React.Fragment>
                        <h4>Results</h4>
                        {{#ifarrlengthgt outputs 1}}
                        <ul>
                        {{#each outputs}}
                            <li>{{emptyname name @index}}: { this.state.output.{{emptyname name @index}} }</li>
                        {{/each}}
                        </ul>
                        {{else}}
                        {this.state.output}
                        {{/ifarrlengthgt}}
                    </React.Fragment>
                    : ''
                }
               
            {{/ifview}}
            </form>
        </div>;
    }
}

{{/each}}


class {{contractName}}UI extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
        };
    }

    render(){
        return (<div>
            {{#each functions}}
            <{{capitalize name}}_{{@index}}_Form />
            {{/each}}
        </div>);
    }
}


ReactDOM.render(<div>
        <h1>{{title}}</h1>
        <{{contractName}}UI />
    </div>,
    document.getElementById('app')
);