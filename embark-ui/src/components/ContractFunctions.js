import PropTypes from "prop-types";
import React, {Component} from 'react';
import {
  Page,
  Grid,
  Form,
  Button,
  List,
  Card
} from "tabler-react";

class ContractFunction extends Component {
  constructor(props) {
    super(props);
    this.state = {inputs: {}};
  }

  static isPureCall(method) {
    return (method.mutability === 'view' || method.mutability === 'pure');
  }

  buttonTitle() {
    const {method} = this.props;
    if (method.name === 'constructor') {
      return 'Deploy';
    }

    return ContractFunction.isPureCall(method) ? 'Call' : 'Send';
  }

  inputsAsArray() {
    return this.props.method.inputs
      .map(input => this.state.inputs[input.name])
      .filter(value => value);
  }

  handleChange(e, name) {
    let newInputs = this.state.inputs;
    newInputs[name] = e.target.value;
    this.setState({inputs: newInputs});
  }

  handleCall(e) {
    e.preventDefault();
    this.props.postContractFunction(this.props.contractProfile.name, this.props.method.name, this.inputsAsArray(), this.state.inputs.gasPrice * 1000000000);
  }

  callDisabled() {
    return this.inputsAsArray().length !== this.props.method.inputs.length;
  }

  render() {
    return (
      <Grid.Row>
        <Grid.Col>
          <Card>
            <Card.Header>
              <Card.Title>{this.props.method.name}</Card.Title>
            </Card.Header>
            <Card.Body>
              {this.props.method.inputs.map(input => (
                <Form.Group key={input.name} label={input.name}>
                  <Form.Input placeholder={input.type} onChange={(e) => this.handleChange(e, input.name)}/>
                </Form.Group>
              ))}
              {!ContractFunction.isPureCall(this.props.method) &&
                <Form.Group key="gasPrice" label="Gas Price (in GWei)(optional)">
                  <Form.Input onChange={(e) => this.handleChange(e, 'gasPrice')}/>
                </Form.Group>
              }
              <Button color="primary" disabled={this.callDisabled()} onClick={(e) => this.handleCall(e)}>
                {this.buttonTitle()}
              </Button>
            </Card.Body>
            {this.props.contractFunctions && this.props.contractFunctions.length > 0 && <Card.Footer>
              <List>
                {this.props.contractFunctions.map(contractFunction => (
                  <List.Item key={contractFunction.result}>
                    {contractFunction.inputs.length > 0 && <p>Inputs: {contractFunction.inputs.join(', ')}</p>}
                    <strong>Result: {contractFunction.result}</strong>
                  </List.Item>
                ))}
              </List>
            </Card.Footer>}
          </Card>
        </Grid.Col>
      </Grid.Row>
    );
  }
}

ContractFunction.propTypes = {
  contractProfile: PropTypes.object,
  method: PropTypes.object,
  contractFunctions: PropTypes.arrayOf(PropTypes.object),
  postContractFunction: PropTypes.func
};

const filterContractFunctions = (contractFunctions, contractName, method) => {
  return contractFunctions.filter((contractFunction) => (
    contractFunction.contractName === contractName && contractFunction.method === method
  ));
};

const ContractFunctions = (props) => {
  const {contractProfile} = props;

  return (
    <Page.Content title={contractProfile.name + ' Functions'}>
      {contractProfile.methods
        .filter((method) => {
          return props.onlyConstructor ? method.type === 'constructor' : method.type !== 'constructor';
        })
        .map(method => <ContractFunction key={method.name}
                                         method={method}
                                         contractFunctions={filterContractFunctions(props.contractFunctions, contractProfile.name, method.name)}
                                         contractProfile={contractProfile}
                                         postContractFunction={props.postContractFunction}/>)}
    </Page.Content>
  );
};

ContractFunctions.propTypes = {
  onlyConstructor: PropTypes.bool,
  contractProfile: PropTypes.object,
  contractFunctions: PropTypes.arrayOf(PropTypes.object),
  postContractFunction: PropTypes.func
};

ContractFunctions.defaultProps = {
  onlyConstructor: false
};

export default ContractFunctions;

