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
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  CardFooter,
  Collapse,
  FormFeedback,
  ListGroup,
  ListGroupItem,
  UncontrolledTooltip
} from "reactstrap";
import GasStationContainer from "../containers/GasStationContainer";
import {formatContractForDisplay} from '../utils/presentation';
import FontAwesome from 'react-fontawesome';
import classnames from 'classnames';
import {getWeiBalanceFromString} from '../utils/utils';
import {ETHER_UNITS} from '../constants';

import "./ContractOverview.scss";

class ContractFunction extends Component {
  constructor(props) {
    super(props);
    this.state = {
      inputs: {},
      optionsCollapse: false,
      functionCollapse: false,
      gasPriceCollapse: false,
      value: 0,
      unitConvertError: null,
      unitConvertDirty: false
    };
  }

  static isPureCall(method) {
    return (method.stateMutability === 'view' || method.stateMutability === 'pure');
  }

  static isPayable(method) {
    return method.payable;
  }

  static isEvent(method) {
    return !this.isPureCall(method) && (method.type === 'event');
  }

  static isFallback(method) {
    return method.type === 'fallback';
  }

  buttonTitle() {
    const {method} = this.props;
    if (method.name === 'constructor') {
      return 'Deploy';
    }

    return ContractFunction.isPureCall(method) ? 'call' : 'send';
  }

  inputsAsArray() {
    return this.props.method.inputs
      .map(input => this.state.inputs[input.name])
      .filter(value => value);
  }

  handleChange(e, name) {
    if (name === `${this.props.method.name}-value`) {
      this.setState({ unitConvertDirty: true });
      try {
        const weiBalance = getWeiBalanceFromString(e.target.value);
        this.setState({ value: weiBalance, unitConvertError: null });
      }
      catch (e) {
        this.setState({ unitConvertError: e.message });
      }
      
    } else {
      const newInputs = this.state.inputs;
      newInputs[name] = e.target.value;
      this.setState({inputs: newInputs});
    }
  }

  autoSetGasPrice(e) {
    e.preventDefault();
    const newInputs = this.state.inputs;
    const currentPrice = this.gasStation.getCurrentGas();
    newInputs.gasPrice = currentPrice >= 0 ? currentPrice : 'Estimate unavailable';
    this.setState({inputs: newInputs});
  }

  handleCall(e) {
    e.preventDefault();
    this.props.postContractFunction(
      this.props.contractName,
      this.props.method.name,
      this.inputsAsArray(),
      this.state.inputs.gasPrice * 1000000000,
      this.state.value
    );
  }

  handleKeyPress(e) {
    if (e.key === 'Enter') {
      if (this.callDisabled()) {
        e.preventDefault();
      } else {
        this.handleCall(e);
      }
    }
  }

  callDisabled() {
    return (this.inputsAsArray().length !== this.props.method.inputs.length) || this.state.unitConvertError;
  }

  toggleOptions() {
    this.setState({
      optionsCollapse: !this.state.optionsCollapse
    });
  }

  toggleGasPrice() {
    this.setState({
      gasPriceCollapse: !this.state.gasPriceCollapse
    });
  }

  toggleFunction() {
    this.setState({
      functionCollapse: !this.state.functionCollapse
    });
  }

  makeBadge(color, codeColor, text) {
    const badgeDark = this.state.functionCollapse;
    const _codeColor = badgeDark ? 'white' : codeColor;
    return (
      <Badge color={color} className={classnames({
        'badge-dark': badgeDark,
        'contract-function-badge': true,
        'float-right': true,
        'p-2': true
      })}>
        <code className={classnames({
          [`code-${_codeColor}`]: true,
        })}>
          {text}
        </code>
      </Badge>
    );
  }

  formatResult(result) {
    result = JSON.stringify(result);
    if (result.startsWith('"')) {
      result = result.slice(1);
    }
    if (result.endsWith('"')) {
      result = result.slice(0, -1);
    }
    return result;
  }

  render() {
    if (ContractFunction.isEvent(this.props.method)) {
      return <React.Fragment/>;
    }
    return (
      <Card className="contract-function-container">
        <CardHeader
          className={classnames({
            'border-bottom-0': !this.state.functionCollapse,
            'rounded': !this.state.functionCollapse
          })}
          onClick={ContractFunction.isFallback(this.props.method)
                   ? () => {}
                   : () => this.toggleFunction()}>
          <CardTitle>
            <span className="contract-function-signature">
              {ContractFunction.isFallback(this.props.method)
               ? 'function()'
               : `${this.props.method.name}` +
               `(${this.props.method.inputs.map(i => i.name).join(', ')})`}
            </span>
            <div>
              {ContractFunction.isFallback(this.props.method)
               ? this.makeBadge('light', 'black', 'fallback')
               : (ContractFunction.isPureCall(this.props.method) &&
                   this.makeBadge('success', 'white', 'call')) ||
                   this.makeBadge('warning', 'black', 'send')}
              {ContractFunction.isPayable(this.props.method) &&
                this.makeBadge('light', 'black', 'payable')
              }
            </div>
          </CardTitle>
        </CardHeader>
        {!ContractFunction.isFallback(this.props.method) &&
         <Collapse isOpen={this.state.functionCollapse} className="relative">
          <CardBody>
            {ContractFunction.isPayable(this.props.method) &&
              <Form inline className="mb-1">
                <Label for={this.props.method.name + '-value'} className="mr-2 font-weight-bold contract-function-input">Transaction value</Label>
                <Input name={this.props.method.name}
                       id={this.props.method.name + '-value'}
                       onChange={(e) => this.handleChange(e, this.props.method.name + '-value')}
                       onKeyPress={(e) => this.handleKeyPress(e)}
                       invalid={this.state.unitConvertError && this.state.unitConvertDirty ? true : null}
                       valid={!this.state.unitConvertError && this.state.unitConvertDirty ? true : null}
                       />
                {<FormFeedback valid={this.state.unitConvertError && this.state.unitConvertDirty ? null : true} tooltip>{this.state.unitConvertError ? this.state.unitConvertError : this.state.value} wei</FormFeedback>}
                <Button close id="PopoverFocus" className="ml-2" type="button">
                  <FontAwesome name="question-circle"/>
                </Button>
                <UncontrolledTooltip trigger="focus" placement="bottom" target="PopoverFocus">
                  Enter a number followed by an ether unit, ie <code>0.5 ether</code> or <code>16 szabo</code>.<br/><br/>If a number is entered without a unit (ie <code>21000</code>), then <code>wei</code> is assumed.<br/><br/>Valid units include {ETHER_UNITS.map((unit, idx) => <React.Fragment><code>{unit}</code><span>{idx !== ETHER_UNITS.length - 1 ? ", " : ""}</span></React.Fragment>)}
                </UncontrolledTooltip>
              </Form>
            }
            <Form inline>
              {this.props.method.inputs.map((input, idx) => (
                <FormGroup key={idx}>
                  <Label for={input.name} className="mr-2 font-weight-bold contract-function-input">
                    {input.name}
                  </Label>
                  <Input name={input.name}
                         id={input.name}
                         placeholder={input.type}
                         onChange={(e) => this.handleChange(e, input.name)}
                         onKeyPress={(e) => this.handleKeyPress(e)}/>
                </FormGroup>
              ))}
            </Form>
            {!ContractFunction.isPureCall(this.props.method) &&
            <Col xs={12} className="mt-3">
              <Row>
                <strong className="collapsable" onClick={() => this.toggleOptions()}>
                  <FontAwesome name={this.state.optionsCollapse ? 'caret-down' : 'caret-right'} className="mr-2"/>
                  Advanced Options
                </strong>
              </Row>
              <Row>
                <Collapse isOpen={this.state.optionsCollapse} className="pl-3">
                  <Form inline className="gas-price-form">
                    <FormGroup key="gasPrice">
                      <Label for="gasPrice" className="mr-2">Gas Price (in GWei) (optional)</Label>
                      <Input name="gasPrice"
                             id="gasPrice"
                             placeholder="uint256"
                             value={this.state.inputs.gasPrice || ''}
                             onChange={(e) => this.handleChange(e, 'gasPrice')}
                             onKeyPress={(e) => this.handleKeyPress(e)}/>
                      <Button onClick={(e) => this.autoSetGasPrice(e)}
                              title="Automatically set the gas price to what is currently in the estimator (default: safe low)">
                        Auto-set
                      </Button>
                    </FormGroup>
                  </Form>
                  <p className="collapsable mb-2" onClick={() => this.toggleGasPrice()}>
                    <FontAwesome name={this.state.gasPriceCollapse ? 'caret-down' : 'caret-right'} className="mr-2"/>
                    Gas price estimator
                  </p>
                  <Collapse isOpen={this.state.gasPriceCollapse}>
                    <GasStationContainer ref={instance => {
                      if (instance) this.gasStation = instance.getWrappedInstance();
                    }}/>
                  </Collapse>
                </Collapse>
              </Row>
            </Col>
            }
            <Button
              className={classnames({
                'btn-sm': true,
                'contract-function-button': true,
                'contract-function-button-with-margin-top': this.state.gasPriceCollapse,
                'float-right': true})}
              color="primary"
              disabled={this.callDisabled()}
              onClick={(e) => this.handleCall(e)}>
              {this.buttonTitle()}
            </Button>
            <div className="clearfix"/>
          </CardBody>
          {this.props.contractFunctions && this.props.contractFunctions.length > 0 && <CardFooter>
            <ListGroup>
              {this.props.contractFunctions.map((contractFunction, idx) => (
                <ListGroupItem key={idx}>
                  {contractFunction.inputs.length > 0 &&
                   <p>Input(s): &nbsp;
                     <span className="contract-function-input-values">
                       {contractFunction.inputs.join(', ')}
                     </span>
                   </p>}
                  Result: &nbsp;
                  <strong>
                    <span className="contract-function-result">
                      {this.formatResult(contractFunction.result)}
                    </span>
                  </strong>
                </ListGroupItem>
              ))}
            </ListGroup>
          </CardFooter>}
        </Collapse>}
      </Card>
    );
  }
}

ContractFunction.propTypes = {
  contractName: PropTypes.string,
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
  const {contract} = props;
  const contractDisplay = formatContractForDisplay(contract);
  if (!contractDisplay) {
    return '';
  }

  return (
    <div>
      {(contractDisplay.state === 'Deployed') && <div>Deployed at {contractDisplay.address}</div>}
      {(contractDisplay.state !== 'Deployed') && <div>{contractDisplay.address}</div>}
      <br/>
      {contract.abiDefinition
        .filter((method) => {
          return props.onlyConstructor ? method.type === 'constructor' : method.type !== 'constructor';
        })
        .sort((a, b) => {
          return (a.name < b.name) ? -1 : 1;
        })
       .map((method, idx) => <ContractFunction key={idx}
                                         contractName={contract.className}
                                         method={method}
                                         contractFunctions={filterContractFunctions(props.contractFunctions, contract.className, method.name)}
                                         postContractFunction={props.postContractFunction}/>)}
    </div>
  );
};

ContractOverview.propTypes = {
  contract: PropTypes.object,
  onlyConstructor: PropTypes.bool,
  contractFunctions: PropTypes.arrayOf(PropTypes.object),
  postContractFunction: PropTypes.func
};

ContractOverview.defaultProps = {
  onlyConstructor: false
};

export default ContractOverview;
