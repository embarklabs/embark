import ContractContext from './contract-context';

class AccountList extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            error: false,
            errorMessage: "",
            accounts: []
        };
    }


    async handleClick(e, updateAccountsCallback){
        e.preventDefault();

        try {
            updateAccountsCallback();
        } catch(err) {
            this.setState({
                error: true,
                errorMessage: e.name + ': ' + e.message
            })
        }

    }

    render(){
        return <ContractContext.Consumer> 
            {(context) => (
            <div>
                <h3>Get Accounts</h3>
                <div className="scenario">
                <div id="getAccounts" className="code">
                    await web3.eth.getAccounts(); <button onClick={event => this.handleClick(event, context.updateAccounts)}>&#9166;</button>
                </div>
                <p className="note"><tt>accounts</tt> variable is available in the console</p>
                {this.state.error ? '<p className="error">' + this.state.errorMessage + '</p>' : ''}
                </div>
            </div>
        )}
        </ContractContext.Consumer>;
    }
}

export default AccountList;
