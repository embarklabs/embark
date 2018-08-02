/*global web3*/
import React from 'react';
import ContractContext from './contract-context';
import MenuItem from './menu-item';
import AccountList from './account-list';
import FunctionArea from './function-area';
import Tab from './tab';
import InstanceSelector from './instance-selector';
import SourceArea from './source-area';
import PropTypes from 'prop-types';

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

    if (props.contract.options.address !== null) {
      this.state.instances = [props.contract.options.address];
      this.state.selectedInstance = props.contract.options.address;
    }
  }

  componentDidMount() {
    this.updateAccounts();
  }

  handleMenuClick(e) {
    e.preventDefault();
    this.setState({
      selectedTab: e.target.getAttribute('data-target')
    });
  }

  async updateAccounts() {
    let accounts = await web3.eth.getAccounts();
    window.accounts = accounts;

    console.log("%cawait web3.eth.getAccounts()", 'font-weight: bold');
    console.log(accounts);

    this.setState({accounts: accounts});
  }

  updateInstances(_instance) {
    this.state.instances.push(_instance);
    this.setState({
      instances: this.state.instances
    });
  }

  handleInstanceSelection(_instance) {
    this.props.contract.options.address = _instance;
    this.setState({
      selectedInstance: _instance
    });
  }

  render() {
    return (
      <ContractContext.Provider value={this.state}>
        <div className="row">
          <div className="col-md-3">
            <h3 className="page-title mb-5">{this.props.name}</h3>
            <div>
              <div className="list-group list-group-transparent mb-0">
                <MenuItem icon="fe-file-plus" click={this.handleMenuClick} selectedTab={this.state.selectedTab}
                          target="deploy" text="Deployment / Utils"/>
                <MenuItem icon="fe-list" click={this.handleMenuClick} selectedTab={this.state.selectedTab}
                          target="functions" text="Functions"/>
                <MenuItem icon="fe-file-text" click={this.handleMenuClick} selectedTab={this.state.selectedTab}
                          target="contract" text="Source Code"/>
              </div>
            </div>
          </div>
          <div className="col-md-9">
            <Tab id="deploy" selectedTab={this.state.selectedTab}>
              <h4 className="mb-5">Deployment Utils</h4>
              <div className="card">
                <div className="card-body">
                  <ul>
                    <li>Open your browser&apos;s console: <code>Tools &gt; Developer Tools</code></li>
                    <li>Remix: <a href="https://remix.ethereum.org" target="_blank" rel="noopener noreferrer">http://remix.ethereum.org</a></li>
                  </ul>
                </div>
              </div>
              <AccountList accountUpdate={this.updateAccounts}/>
              <h5>Deploy</h5>
              {
                this.props.definition.code === "" ? <p>Interface or set to not deploy</p> : ""
              }
              <FunctionArea definition={this.props.definition} contractName={this.props.name}
                            contract={this.props.contract} type="constructor"/>
            </Tab>

            <Tab id="functions" selectedTab={this.state.selectedTab}>
              <h4 className="mb-5">Functions</h4>
              {(this.props.definition.code !== "") && <InstanceSelector selectedInstance={this.state.selectedInstance}
                                                                        instanceUpdate={this.handleInstanceSelection}/>
              }
              <FunctionArea definition={this.props.definition} contractName={this.props.name}
                            contract={this.props.contract} type="function"/>
              <FunctionArea definition={this.props.definition} contractName={this.props.name}
                            contract={this.props.contract} type="fallback"/>
            </Tab>

            <Tab id="contract" selectedTab={this.state.selectedTab}>
              <h4 className="mb-5">Source Code</h4>
              <SourceArea definition={this.props.definition} source={this.props.source}/>
            </Tab>
          </div>
        </div>
        ,


      </ContractContext.Provider>
    );
  }
}

ContractUI.propTypes = {
  definition: PropTypes.object,
  source: PropTypes.string,
  contract: PropTypes.object,
  name: PropTypes.string
};


export default ContractUI;
