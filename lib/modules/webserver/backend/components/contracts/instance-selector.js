import ContractContext from './contract-context';

class InstanceSelector extends  React.Component {

    constructor(props) {
        super(props);
        this.state = {
            showInstances: false,
            showCustomAddressField: false,
            selectedInstance: props.selectedInstance,
            customInstance: "",
            error: false,
            errorMessage: ""
        };

        this.handleShowInstances = this.handleShowInstances.bind(this);
        this.handleChange = this.handleChange.bind(this);
        this.handleClick = this.handleClick.bind(this);
        this.handleTextChange = this.handleTextChange.bind(this);
    }
    
    handleTextChange(e){
        this.setState({customInstance: e.target.value});
    }

    handleShowInstances(e){
        e.preventDefault();
        this.setState({
            showInstances: !this.state.showInstances
        });
    }

    handleClick(e){
        e.preventDefault();

        let instance;
        if(this.state.selectedInstance == "custom"){
            instance = this.state.customInstance;
        } else {
            instance = this.state.selectedInstance;
        }

        if(!/^0x[0-9a-f]{40}$/i.test(instance)){
            this.setState({error: true, errorMessage: 'Not a valid Ethereum address.'});
            console.log(this.state.errorMessage);
            return;
        } else {
            this.setState({error: false});
        }

        this.props.instanceUpdate(instance);

        this.setState({
            showInstances: false,
            showCustomAddressField: false,
            selectedInstance: instance,
            customInstance: this.state.selectedInstance == "custom" ? this.state.customInstance : ""
        })
    }

    handleChange(e){
        this.setState({
            showCustomAddressField: e.target.value == "custom",
            selectedInstance: e.target.value
        });
    }

    render(){

        return <ContractContext.Consumer>
        { (context) => (<div className="contractSelection">
            <h5>
                <b>Instance Selected:</b> <span><b>{this.props.selectedInstance != null ? this.props.selectedInstance : 'none'}</b></span>
                {!this.state.showInstances ? <a href="#" onClick={this.handleShowInstances}>Change</a> : <a href="#" onClick={this.handleShowInstances}>Cancel</a> }
            </h5>
            {this.state.showInstances ? 
            <div className="form-group control-group error">
                <select className="form-control" id="contracts" value={this.state.selectedInstance} onChange={this.handleChange}>
                    <option value="custom">Specific contract address</option>
                    {
                        context.instances.map(function (item, i) {
                            return <option key={i} value={item}>{item}</option>;
                        })
                    }
                </select>
                {
                    this.state.showCustomAddressField ? 
                    <input type="text" className="form-control" id="specificAddress" onChange={this.handleTextChange} placeholder="0x" />
                    : ''
                }
                <button className="btn btn-default" onClick={this.handleClick}>Change</button>
                {
                    this.state.error ?
                    <p className="error">{this.state.errorMessage}</p>
                    : ""
                }
            </div> : "" }
      </div>
        )}
      </ContractContext.Consumer>;
    }

}

export default InstanceSelector;