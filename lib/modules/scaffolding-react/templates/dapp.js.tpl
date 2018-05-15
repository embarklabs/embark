import EmbarkJS from 'Embark/EmbarkJS';
import {{contractName}} from 'Embark/contracts/{{contractName}}';

import React from 'react';
import ReactDOM from 'react-dom';
import { FormGroup, ControlLabel, FormControl, Checkbox, Button, Alert, InputGroup } from 'react-bootstrap';


class {{contractName}}UI extends React.Component {
    constructor (props) {
        super(props);
        this.state = {
        };
    }

    render(){
        return (<div>
            {{#each functions}}
            <{{capitalize name}}Form{{@index}} />
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



{{#each functions}}
class {{capitalize name}}Form{{@index}} extends React.Component {
    constructor(props){
        super(props);
        this.state = {
            {{#if inputs.length}}
            input: {
                {{#each inputs}}
                {{name}}: {{#ifeq type 'bool'}}false{{else}}''{{/ifeq}}{{#unless @last}},{{/unless}}
                {{/each}}
            },
            {{/if}}
            {{#if payable}}
            value: 0,
            {{/if}}
            {{#ifview stateMutability}}
            output: null,
            {{/ifview}}
            error: null,
            mined: null
        };
    }

    handleChange(e, name){
        this.state.input[name] = e.target.value;
        this.setState(this.state);
    }

    handleCheckbox(e, name){
        this.state.input[name] = e.target.checked;
        this.setState(this.state);
    }

    async handleClick(e){
        e.preventDefault();
        this.setState({output: null, error: null, receipt: null});
        
        try {
        {{#ifview stateMutability}}
            {{../contractName}}.methods{{methodname ../functions name inputs}}({{#each inputs}}this.state.input.{{name}}{{#unless @last}}, {{/unless}}{{/each}})
                .call()
                .then((result) => {
            {{#iflengthgt outputs 1}}
                    this.setState({output: {
            {{#each outputs}}
                        {{emptyname name @index}}: result[{{@index}}]{{#unless @last}},{{/unless}}
            {{/each}}
                    }}); 
            {{else}}
                    this.setState({output: result});  
            {{/iflengthgt}} 
                    })
                .catch((err) => {
                    this.setState({error: err.message});
                });
        {{else}}
            {{../contractName}}.methods{{methodname ../functions name inputs}}({{#each inputs}}this.state.input.{{name}}{{#unless @last}}, {{/unless}}{{/each}})
                .send({
                    {{#if payable}}
                    value: this.state.value,
                    {{/if}}
                    from: web3.eth.defaultAccount
                })
                .then((_receipt) => {
                    console.log(_receipt);
                    this.setState({receipt: _receipt})
                    })
                .catch((err) => {
                    console.log(err);
                    this.setState({error: err.message});
                });
        {{/ifview}}
        } catch(err) {
            this.setState({error: err.message});
        }
    }

    render(){
        return <div className="formSection">
            <h3>{{name}}</h3>
            <form>
            {{#if inputs.length}}
                {{#each inputs}}
                <FormGroup>
                    <ControlLabel>{{name}}</ControlLabel>
                    {{#ifeq type 'bool'}}
                    <Checkbox
                        onClick={(e) => this.handleCheckbox(e, '{{name}}')}
                    />
                    {{else}}
                    <FormControl
                        type="text"
                        defaultValue={ this.state.input.{{name}} }
                        placeholder="{{type}}"
                        onChange={(e) => this.handleChange(e, '{{name}}')}
                    />
                    {{/ifeq}}
                </FormGroup>
                {{/each}}      
            {{/if}}
            {{#if payable}}
                <FormGroup>
                    <ControlLabel>Value</ControlLabel>
                    <InputGroup>
                        <InputGroup.Addon>Ξ</InputGroup.Addon>
                        <FormControl 
                            type="text"
                            defaultValue={ this.state.value }
                            placeholder="{{type}}"
                            onChange={(e) => { this.setState({value: e.target.value}); }}
                        />
                        <InputGroup.Addon>wei</InputGroup.Addon>
                    </InputGroup>
                </FormGroup>
            {{/if}}
            {
                this.state.error != null ?
                <Alert bsStyle="danger">{this.state.error}</Alert>
                : ''
            }
            {{#ifview stateMutability}}
                <Button type="submit" bsStyle="primary" onClick={(e) => this.handleClick(e)}>Call</Button>
                {
                    this.state.output != null ?
                    <React.Fragment>
                        <h4>Results</h4>
                        {{#iflengthgt outputs 1}}
                        <ul>
                        {{#each outputs}}
                            <li>{{emptyname name @index}}: { this.state.output.{{emptyname name @index}} }</li>
                        {{/each}}
                        </ul>
                        {{else}}
                        {this.state.output.toString()}
                        {{/iflengthgt}}
                    </React.Fragment>
                    : ''
                }
            {{else}}
                <Button type="submit" bsStyle="primary" onClick={(e) => this.handleClick(e)}>Send</Button>
                {
                this.state.receipt != null ?
                <React.Fragment>
                    <Alert bsStyle={this.state.receipt.status == "0x1" ? 'success' : 'danger'}>{this.state.receipt.status == "0x1" ? 'Success' : 'Failure / Revert'} - Transaction Hash: {this.state.receipt.transactionHash}</Alert>
                </React.Fragment>
                : ''
                }
            {{/ifview}}
            </form>
        </div>;
    }
}

{{/each}}
