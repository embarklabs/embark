import PropTypes from "prop-types";
import React, {Component} from 'react';
import {
  Row,
  Col,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardFooter,
  Collapse,
  ListGroup,
  ListGroupItem
} from "reactstrap";
import {formatContractForDisplay} from '../utils/presentation';

class ContractFunction extends Component {
  constructor(props) {
    super(props);
    this.state = {inputs: {}, optionsCollapse: false, functionCollapse: false};
  }

  static isPureCall(method) {
    return (method.mutability === 'view' || method.mutability === 'pure');
  }

  static isEvent(method) {
    return !this.isPureCall(method) && (method.type === 'event');
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

  toggleOptions() {
    this.setState({
      optionsCollapse: !this.state.optionsCollapse,
    });
  }

  toggleFunction() {
    this.setState({
      functionCollapse: !this.state.functionCollapse,
    });
  }

  render() {
    return (
        <Card>
          <CardHeader>
            <CardTitle className="collapsable contractFunction" onClick={() => this.toggleFunction()}>
              {ContractFunction.isPureCall(this.props.method) &&
                <button class="btn btn-brand btn-sm" style={{ "color": "#fff", "background-color": "#ff4500", "border-color": "#ff4500", "float": "right" }}>call</button>
              }
              {ContractFunction.isEvent(this.props.method) &&
                <button class="btn btn-brand btn-sm" style={{ "color": "#fff", "background-color": "#aad450", "border-color": "#aad450", "float": "right" }}>event</button>
              }
              {this.props.method.name}({this.props.method.inputs.map(input => input.name).join(', ')})
            </CardTitle>
          </CardHeader>
          <Collapse isOpen={this.state.functionCollapse}>
            <CardBody>
              <Form action="" method="post" inline>
              {this.props.method.inputs.map(input => (
                <FormGroup key={input.name} className="pr-1">
                  <Label for={input.name} className="pr-1">{input.name}: </Label>
                  <Input name={input.name} id={input.name} placeholder={input.type} onChange={(e) => this.handleChange(e, input.name)}/>
                </FormGroup>
              ))}
              </Form>
              {!ContractFunction.isPureCall(this.props.method) &&
                <Col xs={12} style={{"margin-bottom": "5px", "margin-top": "5px"}}>
                  <Row>
                  <strong className="collapsable" onClick={() => this.toggleOptions()}><i className={this.state.optionsCollapse ? 'fa fa-caret-down' : 'fa fa-caret-right'}/>Advanced Options</strong>
                    <Col xs={12} style={{"margin-bottom": "5px", "margin-top": "5px"}}>
                      <Row>
                        <Collapse isOpen={this.state.optionsCollapse}>
                          <Form action="" method="post" inline>
                            <FormGroup key="gasPrice" className="pr-1">
                              <Label for="gasPrice" className="pr-1">Gas Price (in GWei)(optional)</Label>
                              <Input name="gasPrice" id="gasPrice" onChange={(e) => this.handleChange(e, 'gasPrice')}/>
                            </FormGroup>
                          </Form>
                        </Collapse>
                     </Row>
                   </Col>
                 </Row>
               </Col>
              }
              <div align="right">
                <Button color="primary" disabled={this.callDisabled()} onClick={(e) => this.handleCall(e)}>
                  {this.buttonTitle()}
                </Button>
              </div>
            </CardBody>
          </Collapse>
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

const ContractOverview = (props) => {
  const {contractProfile, contract} = props;
  const contractDisplay = formatContractForDisplay(contract);

  return (
    <div>
      {(contractDisplay.state === 'Deployed') && <div>Deployed at {contractDisplay.address}</div>}
      {(contractDisplay.state !== 'Deployed') && <div>{contractDisplay.address}</div>}
      <br />
      {contractProfile.methods
        .filter((method) => {
          return props.onlyConstructor ? method.type === 'constructor' : method.type !== 'constructor';
        })
        .map(method => <ContractFunction key={method.name}
                                         method={method}
                                         contractFunctions={filterContractFunctions(props.contractFunctions, contractProfile.name, method.name)}
                                         contractProfile={contractProfile}
                                         postContractFunction={props.postContractFunction} />)}
    </div>
  );
};

ContractOverview.propTypes = {
  contract: PropTypes.object,
  onlyConstructor: PropTypes.bool,
  contractProfile: PropTypes.object,
  contractFunctions: PropTypes.arrayOf(PropTypes.object),
  postContractFunction: PropTypes.func
};

ContractOverview.defaultProps = {
  onlyConstructor: false
};

export default ContractOverview;

