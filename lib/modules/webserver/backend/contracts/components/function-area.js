class FunctionArea extends React.Component {
    constructor(props) {
        super(props);
        this.state = { };
    }

    render(){   
        const type = this.props.type;
        const contract = this.props.contract;
        const contractName = this.props.contractName;
        
        return <React.Fragment>
            {
                this.props.contract.options.jsonInterface
                    .filter(item => item.type == type)
                    .map((item, i) => <FunctionForm definition={this.props.definition} key={i} contract={contract} contractName={contractName} abi={item} instanceUpdate={this.props.instanceUpdate} />)
            }
        </React.Fragment>;
    }
}
