class Function extends React.Component {

    constructor(props) {
        super(props);
        this.state = { 
            onRequest: false,
            fields: {},
            methodFields: {
                from: '',
                to: '',
                value: 0,
                data: '',
                gasLimit: '7000000'
            },
            receipt: null
        };

        this.handleParameterChange = this.handleParameterChange.bind(this);
        this.handleMethodFieldChange = this.handleMethodFieldChange.bind(this);
        this.handleClick = this.handleClick.bind(this);
    }


    copyCommand(e){
        e.preventDefault(); 

        let fields = this.state.fields;

        let functionLabel = this._getFunctionLabel();
        let functionParams = this._getFunctionParamString();
        let methodParams = this._getMethodString();
        if(this.props.abi.type == "constructor")
            functionParams = `{arguments: [${functionParams}]}`;

        const command = `await ${functionLabel}(${functionParams})${this.props.abi.type != 'fallback' ? '.' + this._getMethodType() : ''}${methodParams}`;

        var dummy = document.createElement("input");
        document.body.appendChild(dummy);
        dummy.setAttribute('value', command);
        dummy.select();
        document.execCommand("copy");
        document.body.removeChild(dummy);
    }



    async handleClick(e, instanceUpdateCallback){
        e.preventDefault(); 

        this.setState({onRequest: true, receipt: null});

        this.props.resultHandler(false, null, null);

        let executionParams = {
            from: this.state.methodFields.from,
            gasLimit: this.state.methodFields.gasLimit
        }
        
        if(this.props.abi.payable)
            executionParams.value = this.state.methodFields.value;

        if(this.props.abi.type == 'fallback'){
            executionParams.data = this.state.methodFields.data;
            executionParams.to = this.props.contract.options.address;
        }

        let fields = this.state.fields;

        let functionLabel = this._getFunctionLabel();
        let functionParams = this._getFunctionParamString();
        let methodParams = this._getMethodString();
        if(this.props.abi.type == "constructor")
            functionParams = `{arguments: [${functionParams}]}`;

        console.log(`%cawait ${functionLabel}(${functionParams})${this.props.abi.type != 'fallback' ? '.' + this._getMethodType() : ''}${methodParams}`, 'font-weight: bold');
        
        let _receipt;

        try {
            if(this.props.abi.type == 'constructor'){
                let contractInstance = await this.props.contract.deploy({arguments: Object.keys(fields).map(val => fields[val])}).send(executionParams);
                instanceUpdateCallback(contractInstance.options.address);
                this.setState({onRequest: false});
                console.log(contractInstance.options.address);
                this.props.resultHandler(false, 'New instance: ' + contractInstance.options.address);
            } else {
                
                if(this.props.abi.type == 'fallback')
                    _receipt = await web3.eth.sendTransaction(executionParams);
                else
                    _receipt = await this.props.contract
                                .methods[this.props.abi.name + '(' + this.props.abi.inputs.map(input => input.type).join(',') + ')']
                                .apply(null, Object.keys(fields).map(val => {
                                    let input = this.props.abi.inputs.filter(x => x.name == val)[0];
                                    return input.type.indexOf('bool') == -1 ? fields[val] : (fields[val].toLowerCase() === 'true') 
                                }))
                                [this._getMethodType()](executionParams)
                
                if(this._getMethodType() == 'call'){
                    this.props.resultHandler(false, _receipt, null);
                } else {
                    this.props.resultHandler(false, null, _receipt);
                }
                
                this.setState({onRequest: false, receipt: _receipt});
                console.log(_receipt);
            }

            
        } catch (e) {
            console.error('%s: %s', e.name, e.message);
            this.setState({onRequest: false});
            this.props.resultHandler(true, e.name + ": " + e.message, _receipt);
        }
    }

    handleParameterChange(e){
        let newState = this.state;
        newState.fields[e.target.getAttribute('data-name')] = e.target.value;
        this.setState(newState);
    }

    handleMethodFieldChange(e){
        let newState = this.state;
        newState.methodFields[e.target.getAttribute('data-param')] = e.target.value;
        
        if(e.target.getAttribute('data-param') == 'from'){
            newState.selectedAccount = e.target.options[e.target.selectedIndex].text;
        }
        this.setState(newState);
    }

    _getFunctionLabel(){
        if(this.props.abi.type == 'function')
            if(!this.props.duplicated)
                return `${this.props.contractName}.methods.${this.props.abi.name}`;
            else {
                return `${this.props.contractName}.methods['${this.props.abi.name + '(' + (this.props.abi.inputs != null ? this.props.abi.inputs.map(input => input.type).join(',') : '') + ')'}']`;
            }
        else if(this.props.abi.type == 'fallback'){
            return `web3.eth.sendTransaction`;
        }
        else
            return `${this.props.contractName}.deploy`;
    }

    _getMethodType(){
        return (this.props.abi.constant == true || this.props.abi.stateMutability == 'view' || this.props.abi.stateMutability == 'pure') ? 'call' : 'send';
    }

    _getMethodFields(accounts){
        let methodParams;
        return <React.Fragment>
            from: <select data-param="from" disabled={accounts.length == 0} value={this.state.from} onChange={this.handleMethodFieldChange}>
                    <option>-</option>
                  {
                    accounts.map(function (item, i) {
                        return <option key={i} value={item}>{`accounts[${i}]`}</option>;
                    })
                  }
                  </select>
            {
                this.props.abi.payable ?
                    <span>, value: 
                        <input type="text" data-param="value" value={this.state.methodFields.value} size="6" onChange={this.handleMethodFieldChange} />
                    </span>
                    : ''
            }
            {
                this._getMethodType() == 'send' ?
                    <span>, gasLimit: 
                        <input type="text" data-param="gasLimit" value={this.state.methodFields.gasLimit} size="6" onChange={this.handleMethodFieldChange} />
                    </span>
                    : ''
            }
            {
                this._getMethodType() == 'send' && this.props.abi.type == 'fallback' ?
                    <span>, data: 
                        <input type="text" data-param="data" value={this.state.methodFields.data} size="6" onChange={this.handleMethodFieldChange} />
                    </span>
                    : ''
            }
         </React.Fragment>;
    }


    _getFunctionParamFields(){
        return <React.Fragment>
                { 
                    this.props.abi.inputs
                        .map((input, i) => <input key={i} type="text" data-var-type={input.type} data-type="inputParam" data-name={input.name} placeholder={input.name} title={input.type + ' ' + input.name} size={input.name.length} value={this.state.fields[input.name] || ''}  onChange={this.handleParameterChange} />)
                        .reduce((accu, elem) => {
                            return accu === null ? [elem] : [...accu, ', ', elem]
                        }, null)
                }
                </React.Fragment>;
    }

    _getFunctionParamString(){
        if(this.props.abi.type == 'fallback') return '';
        return this.props.abi.inputs
                .map((input, i) => (input.type.indexOf('int') == -1 && input.type.indexOf('bool') == -1 ? '"' : '') + (this.state.fields[input.name] || (input.type.indexOf('int') == -1 ? '' : '0')) + (input.type.indexOf('int') == -1 ? '"' : ''))
                .join(', ');
    }

    _getMethodString(elem){
        let methodParams = "({";

        methodParams += `from: ` + (this.state.selectedAccount || '"0x00"');
        if(this._getMethodType() == 'send'){
            methodParams += ', gasLimit: ' +  (this.state.methodFields.gasLimit || 0)
            if(this.props.abi.payable){
                methodParams += ', value: ' + (this.state.methodFields.value || 0)
            }
            if(this.props.abi.type == 'fallback'){
                methodParams += ', data: "' +  (this.state.methodFields.data || '"0x00"' ) + '", to: "' + (this.state.methodFields.to || '"0x00"') + '"'
            }
        }
        return methodParams + "})"; 
    }

    render(){

        let btnClass = "btn ml-auto ";
        let disabled = false;

        if(this.state.onRequest){
            disabled = true;
        }

        if(this.props.definition.code == ""){
            btnClass += "btn-secondary";
            disabled = true;
        } else {
            btnClass += "btn-primary";
        }

        return <ContractContext.Consumer>
        { (context) => (
            <React.Fragment>
                <div className="col-md-11">
                    <code>
                    await {this._getFunctionLabel()}
                    { this.props.abi.type != 'fallback' ? '(' : '' }
                    { this.props.abi.type != 'fallback' ? this._getFunctionParamFields() : '' }
                    { this.props.abi.type != 'fallback' ? ')' : '' }
                    { this.props.abi.type != 'fallback' ? '.' + this._getMethodType() : '' }
                    ({ this._getMethodFields(context.accounts) }) 
                    </code>
                </div>
                <div className="col-md-1">
                    <button className={btnClass} title={this.props.definition.code == "" ? "Can't execute function" : "Execute function"} onClick={event => this.handleClick(event, context.updateInstances)} disabled={disabled}>
                    { this.state.onRequest ?
                        <img src="../assets/images/loading.gif" className="loading" alt="" />
                        : 
                        (
                            this.props.definition.code == "" 
                            ?
                            <React.Fragment>_</React.Fragment>
                            :
                            <React.Fragment>&#9166;</React.Fragment>
                        )
                        
                    }
                    </button>
                </div>
            </React.Fragment>
        )}
        </ContractContext.Consumer>;
    }

}