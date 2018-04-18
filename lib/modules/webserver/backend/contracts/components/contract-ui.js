class ContractUI extends React.Component {
    constructor(props) {
        super(props);

        this.updateInstances = this.updateInstances.bind(this);
        this.updateAccounts = this.updateAccounts.bind(this);
        this.handleInstanceSelection = this.handleInstanceSelection.bind(this);
        this.handleMenuClick = this.handleMenuClick.bind(this);
        
        this.state = {
            accounts: [],
            instances: [],
            selectedInstance: null,
            updateAccounts: this.updateAccounts,
            updateInstances: this.updateInstances,
            selectedTab: 'deploy'
        };

        if(props.contract.options.address != null){
            this.state.instances = [props.contract.options.address];
            this.state.selectedInstance = props.contract.options.address;
        }
    }

    componentDidMount(){
        this.updateAccounts();
    }

    handleMenuClick(e){
        console.log(e.target);
        e.preventDefault();
        this.setState({
            selectedTab: e.target.getAttribute('data-target')
        });
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
            <div className="row">
                <div className="col-md-3">
                    <h3 className="page-title mb-5">{this.props.name}</h3>
                    <div>
                        <div className="list-group list-group-transparent mb-0">
                            <MenuItem click={this.handleMenuClick} target="deploy" text="Deployment / Utils" />
                            <MenuItem click={this.handleMenuClick} target="functions" text="Functions" />
                            <MenuItem click={this.handleMenuClick} target="contract" text="Source Code" />
                        </div>
                    </div>
                </div>
                <div className="col-md-9">
                    <Tab id="deploy" selectedTab={this.state.selectedTab}>
                        <h4 className="mb-5">Deployment Utils</h4>
                        <div className="card">
                            <div className="card-body">
                                <ul>
                                    <li>Open your browser's console: <code>Tools &gt; Developer Tools</code></li>
                                    <li>Remix: <a href="https://remix.ethereum.org" target="_blank">http://remix.ethereum.org</a></li>
                                </ul>
                            </div>
                        </div>
                        <AccountList accountUpdate={this.updateAccounts} />
                        <h5>Deploy</h5>
                        <FunctionArea contractName={this.props.name} contract={this.props.contract} type="constructor" />
                    </Tab>

                    <Tab id="functions" selectedTab={this.state.selectedTab}>
                        <h4 className="mb-5">Functions</h4>
                        <InstanceSelector selectedInstance={this.state.selectedInstance} instanceUpdate={this.handleInstanceSelection} />
                        <FunctionArea contractName={this.props.name} contract={this.props.contract} type="function" />
                        <FunctionArea contractName={this.props.name} contract={this.props.contract} type="fallback" />
                    </Tab>

                    <Tab id="contract" selectedTab={this.state.selectedTab}>
                        <h4 className="mb-5">Source Code</h4>
                        <SourceArea definition={this.props.definition} source={this.props.source} />
                    </Tab>
                </div>
            </div>,
















                
                

            
            </ContractContext.Provider>
        )
    }
}