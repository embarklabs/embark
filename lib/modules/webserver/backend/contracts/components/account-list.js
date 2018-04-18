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

            <div className="card function">
                <div className="card-header">
                    <h3 className="card-title">Get Accounts</h3>
                </div>
                {
                    this.state.error 
                    ? 
                    <div className="card-alert alert alert-danger mb-0">
                    {this.state.errorMessage}
                    </div> 
                    : 
                    ''
                }
                <div className="card-body row">
                    <div className="col-md-11">
                        <code>
                            await web3.eth.getAccounts();
                            <input type="text" id="accountsTxt" />
                        </code>
                    </div>
                    <div className="col-md-1">
                        <button className="btn btn-primary ml-auto" onClick={event => this.handleClick(event, context.updateAccounts)}>&#9166;</button>
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