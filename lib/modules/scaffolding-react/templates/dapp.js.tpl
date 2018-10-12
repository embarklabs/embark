import EmbarkJS from 'Embark/EmbarkJS';
import {{contractName}} from 'Embark/contracts/{{contractName}}';

import React, { Component, Fragment } from 'react';
import ReactDOM from 'react-dom';
import { FormGroup, ControlLabel, FormControl, Checkbox, Button, Alert, InputGroup } from 'react-bootstrap';


{{#each functions}}
class {{capitalize name}}Form{{@index}} extends Component {
    constructor(props){
        super(props);
        this.state = {
            {{#if inputs.length}}
            input: {
                {{#each inputs}}
                {{#ifeq name ''}}field{{else}}{{trim name}}{{/ifeq}}: {{#ifeq type 'bool'}}false{{else}}''{{/ifeq}}{{#unless @last}},{{/unless}}
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
        const {input} = this.state;
        input[name] = e.target.value;
        this.setState({input});
    }

    handleCheckbox(e, name){
        const {input} = this.state;
        input[name] = e.target.checked;
        this.setState({input});
    }

    async handleClick(e){
        e.preventDefault();

        const {input, value} = this.state;

        this.setState({output: null, error: null, receipt: null});

        try {
        {{#ifview stateMutability}}
            const result = await {{../contractName}}.methods{{methodname ../functions name inputs}}({{#each inputs}}input.{{#ifeq name ''}}field{{else}}{{trim name}}{{/ifeq}}{{#unless @last}}, {{/unless}}{{/each}}).call()
            {{#iflengthgt outputs 1}}
            this.setState({output: {
            {{#each outputs}}
                {{emptyname name @index}}: result[{{@index}}]{{#unless @last}},{{/unless}}
            {{/each}}
            }}); 
            {{else}}
            this.setState({output: result});  
            {{/iflengthgt}}           
        {{else}}
            {{#each inputs}}
            {{#ifarr type}}
            input.{{trim name}} = input.{{trim name}}.split(',').map(x => trim(x.toString()));
            {{/ifarr}}
            {{/each}}

            const toSend = {{../contractName}}.methods{{methodname ../functions name inputs}}({{#each inputs}}input.{{#ifeq name ''}}field{{else}}{{trim name}}{{/ifeq}}{{#unless @last}}, {{/unless}}{{/each}});

            const estimatedGas = await toSend.estimateGas({from: web3.eth.defaultAccount});
            
            const receipt = await toSend.send({
                {{#if payable}}
                value: value,
                {{/if}}
                from: web3.eth.defaultAccount,
                gasLimit: estimatedGas
            });

            console.log(receipt);

            this.setState({receipt});
        {{/ifview}}
        } catch(err) {
            console.error(err);
            this.setState({error: err.message});
        }
    }

    render(){
        const {input, value, error, output, receipt} = this.state;

        return <div className="formSection">
            <h3>{{name}}</h3>
            <form>
            {{#if inputs.length}}
                {{#each inputs}}
                <FormGroup>
                    <ControlLabel>{{#ifeq name ''}}field{{else}}{{name}}{{/ifeq}}</ControlLabel>
                    {{#ifeq type 'bool'}}
                    <Checkbox
                        onClick={(e) => this.handleCheckbox(e, '{{#ifeq name ''}}field{{else}}{{trim name}}{{/ifeq}}')}
                    />
                    {{else}}
                    <FormControl
                        type="text"
                        defaultValue={ input.{{#ifeq name ''}}field{{else}}{{trim name}}{{/ifeq}} }
                        placeholder="{{type}}"
                        onChange={(e) => this.handleChange(e, '{{#ifeq name ''}}field{{else}}{{trim name}}{{/ifeq}}')}
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
                            defaultValue={ value }
                            placeholder="{{type}}"
                            onChange={(e) => { this.setState({value: e.target.value}); }}
                        />
                        <InputGroup.Addon>wei</InputGroup.Addon>
                    </InputGroup>
                </FormGroup>
            {{/if}}

                { error != null && <Alert bsStyle="danger">{error}</Alert> }

            {{#ifview stateMutability}}
                <Button type="submit" bsStyle="primary" onClick={(e) => this.handleClick(e)}>Call</Button>
                {
                    output &&
                    <Fragment>
                        <h4>Results</h4>
                        {{#iflengthgt outputs 1}}
                        <ul>
                        {{#each outputs}}
                            <li>{{emptyname name @index}}: { output.{{emptyname name @index}} }</li>
                        {{/each}}
                        </ul>
                        {{else}}
                        {output.toString()}
                        {{/iflengthgt}}
                    </Fragment>
                }
            {{else}}
                <Button type="submit" bsStyle="primary" onClick={(e) => this.handleClick(e)}>Send</Button>
                {
                receipt &&
                <Fragment>
                    <Alert bsStyle={receipt.status == "0x1" ? 'success' : 'danger'}>{receipt.status == "0x1" ? 'Success' : 'Failure / Revert'} - Transaction Hash: {receipt.transactionHash}</Alert>
                </Fragment>
                
                }
            {{/ifview}}
            </form>
        </div>;
    }
}

{{/each}}

function {{contractName}}UI(props) {
    return (<div>
            <h1>{{title}}</h1>
            {{#each functions}}
            <{{capitalize name}}Form{{@index}} />
            {{/each}}
        </div>);
}


ReactDOM.render(<{{contractName}}UI />, document.getElementById('app'));
