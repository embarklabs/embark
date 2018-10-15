import PropTypes from "prop-types";
import React, {Component} from 'react';
import {
  Row,
  Col,
  FormGroup,
  Label,
  Input,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardFooter,
  ListGroup,
  ListGroupItem
} from "reactstrap";

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
      <Col xs={12}>
        <Card>
          <CardHeader>
            <CardTitle>{this.props.method.name}</CardTitle>
          </CardHeader>
          <CardBody>
            {this.props.method.inputs.map(input => (
              <FormGroup key={input.name}>
                <Label for={input.name}>{input.name}</Label>
                <Input name={input.name} id={input.name} placeholder={input.type} onChange={(e) => this.handleChange(e, input.name)}/>
              </FormGroup>
            ))}
            {!ContractFunction.isPureCall(this.props.method) &&
              <FormGroup key="gasPrice">
                <Label for="gasPrice">Gas Price (in GWei)(optional)</Label>
                <Input name="gasPrice" id="gasPrice" onChange={(e) => this.handleChange(e, 'gasPrice')}/>
              </FormGroup>
            }
            <Button color="primary" disabled={this.callDisabled()} onClick={(e) => this.handleCall(e)}>
              {this.buttonTitle()}
            </Button>
          </CardBody>
          {this.props.contractFunctions && this.props.contractFunctions.length > 0 && <CardFooter>
            <ListGroup>
              {this.props.contractFunctions.map(contractFunction => (
                <ListGroupItem key={contractFunction.result}>
                  {contractFunction.inputs.length > 0 && <p>Inputs: {contractFunction.inputs.join(', ')}</p>}
                  <strong>Result: {contractFunction.result}</strong>
                </ListGroupItem>
              ))}
            </ListGroup>
          </CardFooter>}
        </Card>
      </Col>
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
    <Row>
      <Col xs={12}><h1>{contractProfile.name} Functions</h1></Col>
      {contractProfile.methods
        .filter((method) => {
          return props.onlyConstructor ? method.type === 'constructor' : method.type !== 'constructor';
        })
        .map(method => <ContractFunction key={method.name}
                                         method={method}
                                         contractFunctions={filterContractFunctions(props.contractFunctions, contractProfile.name, method.name)}
                                         contractProfile={contractProfile}
                                         postContractFunction={props.postContractFunction}/>)}
    </Row>
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

