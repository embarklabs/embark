import EmbarkJS from 'Embark/EmbarkJS';
import SimpleStorage from '../../embarkArtifacts/contracts/SimpleStorage';
import React from 'react';
import {Form, FormGroup, Input, HelpBlock, Button, FormText} from 'reactstrap';

class Blockchain extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      valueSet: 10,
      valueGet: "",
      logs: []
    };
  }

  handleChange(e) {
    this.setState({ valueSet: e.target.value });
  }

  checkEnter(e, func) {
    if (e.key !== 'Enter') {
      return;
    }
    e.preventDefault();
    func.apply(this, [e]);
  }

  async setValue(e) {
    e.preventDefault();
    var value = parseInt(this.state.valueSet, 10);

    SimpleStorage.methods.set(value).send();
    this._addToLog("SimpleStorage.methods.set(value).send()");
  }

  getValue(e) {
    e.preventDefault();

    SimpleStorage.methods.get().call().then(_value => this.setState({ valueGet: _value }));
    this._addToLog("SimpleStorage.methods.get(console.log)");
  }

  _addToLog(txt) {
    this.state.logs.push(txt);
    this.setState({ logs: this.state.logs });
  }

  render() {
    return (<React.Fragment>
        <h3> 1. Set the value in the blockchain</h3>
        <Form onKeyDown={(e) => this.checkEnter(e, this.setValue)}>
          <FormGroup className="inline-input-btn">
            <Input
              type="text"
              defaultValue={this.state.valueSet}
              onChange={(e) => this.handleChange(e)}/>
            <Button color="primary" onClick={(e) => this.setValue(e)}>Set Value</Button>
            <FormText color="muted">Once you set the value, the transaction will need to be mined and then the value will be updated
              on the blockchain.</FormText>
          </FormGroup>
        </Form>

        <h3> 2. Get the current value</h3>
        <Form>
          <FormGroup>
            <Button color="primary" onClick={(e) => this.getValue(e)}>Get Value</Button>
            <FormText color="muted">Click the button to get the current value. The initial value is 100.</FormText>
            {this.state.valueGet && this.state.valueGet !== 0 &&
            <p>Current value is <span className="value font-weight-bold">{this.state.valueGet}</span></p>}
          </FormGroup>
        </Form>

        <h3> 3. Contract Calls </h3>
        <p>Javascript calls being made: </p>
        <div className="logs">
          {
            this.state.logs.map((item, i) => <p key={i}>{item}</p>)
          }
        </div>
      </React.Fragment>
    );
  }
}

export default Blockchain;
