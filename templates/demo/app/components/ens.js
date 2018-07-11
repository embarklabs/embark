import EmbarkJS from 'Embark/EmbarkJS';
import React from 'react';
import {Alert, Form, FormGroup, FormControl, Button} from 'react-bootstrap';

window.EmbarkJS = EmbarkJS;

class ENS extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      valueResolve: 'ethereumfoundation.eth',
      responseResolve: null,
      isResolveError: false,
      valueLookup: '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
      responseLookup: null,
      isLookupError: false,
      embarkLogs: []
    };
  }

  handleChange(stateName, e) {
    this.setState({[stateName]: e.target.value});
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
          responseResolve: err,
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
          responseLookup: err,
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
        {
          !this.props.enabled ?
            <React.Fragment>
              <Alert bsStyle="warning">ENS provider might not be set</Alert>
            </React.Fragment> : ''
        }
        <h3>Resolve a name</h3>
        <Form inline>
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
        <Form inline>
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
