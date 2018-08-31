/*global web3*/
import EmbarkJS from 'Embark/EmbarkJS';
import React from 'react';
import { Alert, Form, FormGroup, FormControl, Button } from 'react-bootstrap';

window.EmbarkJS = EmbarkJS;

class ENS extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      valueResolve: 'eth',
      responseResolve: null,
      isResolveError: false,
      valueLookup: '',
      responseLookup: null,
      isLookupError: false,
      valueRegister: '',
      addressRegister: '',
      responseRegister: null,
      isRegisterError: false,
      embarkLogs: []
    };
  }

  componentDidMount() {
    EmbarkJS.onReady(() => {
      if (!web3.eth.defaultAccount) {
        this.setState({
          globalError: 'There is currently no default account. If Metamask is active, please sign in or deactivate it.'
        });
      }
      this.setState({
        addressRegister: web3.eth.defaultAccount,
        valueLookup: web3.eth.defaultAccount
      })
    });
  }

  handleChange(stateName, e) {
    this.setState({ [stateName]: e.target.value });
  }

  checkEnter(e, func) {
    if (e.key !== 'Enter') {
      return;
    }
    e.preventDefault();
    func.apply(this, [e]);
  }

  registerSubDomain(e) {
    e.preventDefault();
    const self = this;
    const embarkLogs = this.state.embarkLogs;
    embarkLogs.push(`EmbarkJS.Names.registerSubDomain('${this.state.valueRegister}', '${this.state.addressRegister}', console.log)`);
    this.setState({
      embarkLogs: embarkLogs
    });

    EmbarkJS.Names.registerSubDomain(this.state.valueRegister, this.state.addressRegister, (err, transaction) => {
      const message = err ? err : `Successfully registered "${this.state.valueRegister}" with ${transaction.gasUsed} gas`;
      self.setState({
        responseRegister: message,
        isRegisterError: !!err
      });
    });
  }

  resolveName(e) {
    e.preventDefault();
    const embarkLogs = this.state.embarkLogs;
    embarkLogs.push(`EmbarkJS.Names.resolve('${this.state.valueResolve}', console.log)`);

    this.setState({
      embarkLogs: embarkLogs
    });
    EmbarkJS.Names.resolve(this.state.valueResolve, (err, result) => {
      if (err) {
        return this.setState({
          responseResolve: err.message || err,
          isResolveError: true
        });
      }
      this.setState({
        responseResolve: result,
        isResolveError: false
      });
    });
  }

  lookupAddress(e) {
    e.preventDefault();
    const embarkLogs = this.state.embarkLogs;
    embarkLogs.push(`EmbarkJS.Names.resolve('${this.state.valueLookup}', console.log)`);

    this.setState({
      embarkLogs: embarkLogs
    });
    EmbarkJS.Names.lookup(this.state.valueLookup, (err, result) => {
      if (err) {
        return this.setState({
          responseLookup: err.message || err,
          isLookupError: true
        });
      }
      this.setState({
        responseLookup: result,
        isLookupError: false
      });
    });
  }

  render() {
    return (<React.Fragment>
        {this.state.globalError && <Alert bsStyle="danger">{this.state.globalError}</Alert>}
        <h3>Resolve a name</h3>
        <Form inline onKeyDown={(e) => this.checkEnter(e, this.resolveName)}>
          <FormGroup>
            {this.state.responseResolve &&
            <Alert className="alert-result" bsStyle={this.state.isResolveError ? 'danger' : 'success'}>
              Resolved address: <span className="value">{this.state.responseResolve}</span>
            </Alert>}
            <FormControl
              type="text"
              defaultValue={this.state.valueResolve}
              onChange={(e) => this.handleChange('valueResolve', e)}/>
            <Button bsStyle="primary" onClick={(e) => this.resolveName(e)}>Resolve name</Button>
          </FormGroup>
        </Form>

        <h3>Lookup an address</h3>
        <Form inline onKeyDown={(e) => this.checkEnter(e, this.lookupAddress)}>
          <FormGroup>
            {this.state.responseLookup &&
            <Alert className="alert-result" bsStyle={this.state.isLookupError ? 'danger' : 'success'}>
              Looked up domain: <span className="value">{this.state.responseLookup}</span>
            </Alert>}
            <FormControl
              type="text"
              defaultValue={this.state.valueLookup}
              onChange={(e) => this.handleChange('valueLookup', e)}/>
            <Button bsStyle="primary" onClick={(e) => this.lookupAddress(e)}>Lookup address</Button>
          </FormGroup>
        </Form>

        <h3>Register subdomain</h3>
        <Form inline onKeyDown={(e) => this.checkEnter(e, this.registerSubDomain)}>
          <FormGroup>
            {this.state.responseRegister &&
            <Alert className="alert-result" bsStyle={this.state.isRegisterError ? 'danger' : 'success'}>
              <span className="value">{this.state.responseRegister}</span>
            </Alert>}
            <FormControl
              type="text"
              defaultValue={this.state.valueRegister}
              onChange={(e) => this.handleChange('valueRegister', e)}/>
            <FormControl
              type="text"
              defaultValue={this.state.addressRegister}
              onChange={(e) => this.handleChange('addressRegister', e)}/>
            <Button bsStyle="primary" onClick={(e) => this.registerSubDomain(e)}>Register subdomain</Button>
          </FormGroup>
        </Form>

        <h3>Embark Calls </h3>
        <p>Javascript calls being made: </p>
        <div className="logs">
          {
            this.state.embarkLogs.map((item, i) => <p key={i}>{item}</p>)
          }
        </div>
      </React.Fragment>
    );
  }
}

export default ENS;
