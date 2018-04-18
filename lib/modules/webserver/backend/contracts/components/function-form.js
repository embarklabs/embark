class FunctionForm extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            fields: {},
            error: false,
            message: null,
            receipt: null
        };

        this.showResults = this.showResults.bind(this);
    }

    _getFunctionParamFields(elem){
        if(this.props.abi.type == 'fallback') return '';
            
        return '(' + this.props.abi.inputs
                .map((input, i) => <input type="text" data-var-type={input.type} data-type="inputParam" data-name={input.name} placeholder={input.name} title={input.type + ' ' + input.name} size={input.name.length}  />)
                .join(', ') + ')';
    }

    _getMethodType(elem){
        return (this.props.abi.constant == true || this.props.abi.stateMutability == 'view' || this.props.abi.stateMutability == 'pure') ? 'call' : 'send';
    }

    render(){
        const functionName = this.props.abi.name;
        const isDuplicated = this.props.contract.options.jsonInterface.filter(x => x.name == functionName).length > 1;
        const contract = this.props.contract;
        const receipt = this.state.receipt;

        return <div className="card function">
            { 
                this.props.abi.type == "function" || this.props.abi.type == "fallback"
                ?
                <div className="card-header">
                    <h3 className="card-title">{this.props.abi.type == 'function'  ? this.props.abi.name : (this.props.abi.type == 'fallback' ? '(fallback)' : this.props.abi.name)}</h3>
                </div>
                : 
                ""
            }
            {
                this.state.error 
                ? 
                <div className="card-alert alert alert-danger mb-0">
                {this.state.message}
                </div>
                : 
                '' 
            }
            <div className="card-body row">
                <Function contract={this.props.contract} contractName={this.props.contractName} duplicated={isDuplicated} abi={this.props.abi} resultHandler={this.showResults} />
           </div>
           {
               receipt != null || !this.state.error && this.state.message != null 
               ?
                <div className="card-footer">
                    { receipt != null ?
                    <ul>
                        <li>Status: {receipt.status}</li>
                        <li>Transaction Hash: {receipt.transactionHash}</li>
                        {
                        receipt.events != null ?
                        <li>Events:
                        <ul>
                            {
                                Object.keys(receipt.events).map(function(ev, index) {
                                    if(!isNaN(ev)) return null;
                                    const eventAbi = contract.options.jsonInterface.filter(x => x.name == ev)[0];
                                    let props = [];
                                    for(let prop in receipt.events[ev].returnValues){
                                        if(isNaN(prop)){
                                            let input = eventAbi.inputs.filter(x => x.name == prop)[0];
                                            props.push(prop + ': ' 
                                                        + (input.type.indexOf('int') == -1 ? '"' : '')
                                                        + receipt.events[ev].returnValues[prop] 
                                                        + (input.type.indexOf('int') == -1 ? '"' : ''));
                                        }
                                    }
                                return <li key={index}>{ev}({props.join(', ')})</li>;
                                })
                            }
                        </ul>
                        </li>
                        : ''
                    }
                    </ul> 
                    : ""
                    }
                    {
                        !this.state.error && this.state.message != null 
                        ? 
                        <React.Fragment>{this.state.message}</React.Fragment>
                        : '' }
                    
                </div>
                : '' 
            }
        </div>;
    }

    showResults(_error, _message, _receipt){
        this.setState({
            error: _error,
            message: _message,
            receipt: _receipt
        })
    }
}