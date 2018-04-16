import Tab from './tab'; 
import AccountList from './account-list';
import SourceArea from './source-area';
import InstanceSelector from './instance-selector';
import FunctionArea from './function-area';
import ContractContext from './contract-context';


class ContractUI extends React.Component {
    constructor(props) {
        super(props);

        this.updateInstances = this.updateInstances.bind(this);
        this.updateAccounts = this.updateAccounts.bind(this);
        this.handleInstanceSelection = this.handleInstanceSelection.bind(this);

        this.state = {
            accounts: [],
            instances: [],
            selectedInstance: null,
            updateAccounts: this.updateAccounts,
            updateInstances: this.updateInstances
        };

        if(props.contract.options.address != null){
            this.state.instances = [props.contract.options.address];
            this.state.selectedInstance = props.contract.options.address;
        }
    }

    componentDidMount(){
        this.updateAccounts();
    }

    async updateAccounts(){
        let accounts = await web3.eth.getAccounts();
        window.accounts = accounts;

        console.log("%cawait web3.eth.getAccounts()", 'font-weight: bold');
        console.log(accounts);

        this.setState({accounts: accounts});
    }

    updateInstances(_instance){
        this.state.instances.push(_instance);
        this.setState({
            instances: this.state.instances
        });
    }

    handleInstanceSelection(_instance){
        this.props.contract.options.address = _instance;
        this.setState({
            selectedInstance: _instance
        })
    }

    render() {
        return (
            <ContractContext.Provider value={this.state}>
            <div>
                <h1><span>{this.props.name}</span> <small>contract</small></h1>
                <p>Open your browser's console: <code>Tools &gt; Developer Tools</code></p>
                <p>Remix: <a href="https://remix.ethereum.org">http://remix.ethereum.org</a></p>
                <ul className="nav nav-tabs" role="tablist" id="myTabs">
                    <li role="presentation" className="active"><a href="#deploy" role="tab" data-toggle="tab">Instance</a></li>
                    <li role="presentation"><a href="#functions" role="tab" data-toggle="tab">Functions</a></li>
                    <li role="presentation"><a href="#contract" role="tab" data-toggle="tab">Contract</a></li>
                </ul>
                <div className="tab-content">
                    <Tab id="deploy" name="Deployment / Utils" active={true}>
                        <AccountList accountUpdate={this.updateAccounts} />
                        <h3>Deploy</h3>
                        <FunctionArea contractName={this.props.name} contract={this.props.contract} type="constructor" />
                    </Tab>
                    <Tab id="functions" name="Functions">
                        <InstanceSelector selectedInstance={this.state.selectedInstance} instanceUpdate={this.handleInstanceSelection} />
                        <FunctionArea contractName={this.props.name} contract={this.props.contract} type="function" />
                        <FunctionArea contractName={this.props.name} contract={this.props.contract} type="fallback" />
                    </Tab>
                    <Tab id="contract" name="Contract">
                        <SourceArea sourceURL={this.props.sourceURL} />
                    </Tab>
                </div>
            </div>
            </ContractContext.Provider>
        )
    }
}

export default ContractUI;