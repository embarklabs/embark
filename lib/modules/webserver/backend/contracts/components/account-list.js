import React from 'react';
import ContractContext from './contract-context';
import CardAlert from './card-alert';

class AccountList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      error: false,
      errorMessage: "",
      accounts: []
    };

    this.handleClick = this.handleClick.bind(this);
    this.handleCopyClick = this.handleCopyClick.bind(this);
  }


  handleClick(e, updateAccountsCallback) {
    e.preventDefault();

    try {
      updateAccountsCallback();
    } catch (err) {
      this.setState({
        error: true,
        errorMessage: e.name + ': ' + e.message
      });
    }

  }

  handleCopyClick(e) {
    e.preventDefault();

    var dummy = document.createElement("input");
    document.body.appendChild(dummy);
    dummy.setAttribute('value', "await web3.eth.getAccounts();");
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
  }

  render() {
    return <ContractContext.Consumer>
      {(context) => (

        <div className="card function">
          <div className="card-header">
            <h3 className="card-title">Get Accounts</h3>
            <div className="card-options">
              <a href="#" onClick={this.handleCopyClick} title="Copy to clipboard"><i className="fe fe-copy"></i></a>
            </div>
          </div>
          <CardAlert show={this.state.error} message={this.state.errorMessage}/>
          <div className="card-body row">
            <div className="col-md-11">
              <code>
                await web3.eth.getAccounts();
                <input type="text" id="accountsTxt"/>
              </code>
            </div>
            <div className="col-md-1">
              <button className="btn btn-primary ml-auto"
                      onClick={event => this.handleClick(event, context.updateAccounts)}>&#9166;</button>
            </div>
          </div>
          <div className="card-footer">
            <p><tt>accounts</tt> variable is available in the console</p>
            <ul>
              {
                context.accounts.map((account, i) => <li key={i}>{account}</li>)
              }
            </ul>
          </div>
        </div>
      )}
    </ContractContext.Consumer>;
  }
}

export default AccountList;
