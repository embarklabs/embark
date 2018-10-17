import PropTypes from "prop-types";
import React from 'react';
import {
  Row,
  Col,
  FormGroup,
  Input,
  Label,
  UncontrolledTooltip,
  Button,
  Card,
  CardHeader,
  CardBody
} from 'reactstrap';
import classNames from 'classnames';
import {DEPLOYMENT_PIPELINES} from '../constants';

const orderClassName = (address) => {
  return classNames({
    badge: true,
    'badge-success': address,
    'badge-secondary': !address
  });
}

// TODO add an ABI parser
const findConstructor = (abiDefinition) => abiDefinition.find(method => method.type === 'constructor');

const NoWeb3 = () => (
  <Row>
    <Col>
      <h3>You are not connected to web3 yet</h3>
    </Col>
  </Row>
)

const LayoutContract = ({contract, children}) => (
  <Row className="border-bottom border-primary pb-3 mt-4">
    <Col xs={1} className="text-center">
      <h4><span className={orderClassName(contract.address)}>{contract.index + 1}</span></h4>
    </Col>
    <Col xs={11}>
      {children}
    </Col>
  </Row>
)

const DeploymentResult = ({deployment}) => {
  if (deployment.running) {
    return <p>Deployment is in progress <i className="fa fa-spinner fa-spin fa-fw"/></p>
  }

  if (deployment.error) {
    return <p className="text-danger">Deployment failed: {deployment.error}</p>
  }

  return (
    <React.Fragment>
      <p className="text-success">Deployment succeed:</p>
      <dl class="row">
        <dt class="col-sm-3">Transaction</dt>
        <dd class="col-sm-9">{deployment.transactionHash}</dd>

        <dt class="col-sm-3">Gas used</dt>
        <dd class="col-sm-9">{deployment.gasUsed}</dd>

        <dt class="col-sm-3">Address</dt>
        <dd class="col-sm-9">{deployment.contractAddress}</dd>
      </dl>
    </React.Fragment>
  )
}

const GasEstimateResult = ({gasEstimate}) => {
  if (gasEstimate.running) {
    return <p>Gas Estimation is in progresss <i className="fa fa-spinner fa-spin fa-fw"/></p>
  }

  if (gasEstimate.error) {
    return <p className="text-danger">Gas Estimation failed: {gasEstimate.error}</p>
  }

  return <p className="text-success">Gas Estimation succeed: {gasEstimate.gas}</p>
}

class Web3Contract extends React.Component {
  constructor(props) {
    super(props);
    this.state = {inputs: {}};
  }

  handleOnChange(event, name) {
    let newInputs = this.state.inputs;
    newInputs[name] = event.target.value;
    this.setState({inputs: newInputs});
  }

  inputsAsArray() {
    return findConstructor(this.props.contract.abiDefinition).inputs
      .map(input => this.state.inputs[input.name])
      .filter(value => value);
  }

  actionDisabled() {
    return this.inputsAsArray().length !== findConstructor(this.props.contract.abiDefinition).inputs.length;
  }

  render() {
    const abiConstructor = findConstructor(this.props.contract.abiDefinition);
    const isInterface = !abiConstructor;
    const argumentsRequired = abiConstructor && abiConstructor.inputs.length > 0;
    return (
      <LayoutContract contract={this.props.contract}>
        <Row>
          <Col md={6}>
            {isInterface && <h5>{this.props.contract.className} is an interface</h5>}
            {!isInterface && <h5>{this.props.contract.className}</h5>}
            {argumentsRequired &&
              <Card>
                <CardHeader>
                  <strong>Arguments:</strong>
                </CardHeader>
                <CardBody>
                  {abiConstructor.inputs.map(input => (
                    <FormGroup key={input.name}>
                      <Label htmlFor={input.name}>{input.name}</Label>
                      <Input id={input.name} placeholder={input.name} onChange={e => this.handleOnChange(e, input.name)} />
                    </FormGroup>
                  ))}
                </CardBody>
              </Card>
            }

            {!this.props.web3 && <NoWeb3 />}

            {this.props.web3 && !isInterface &&
              <React.Fragment>
                <Button className="mr-2" 
                        color="primary" 
                        disabled={this.actionDisabled()} 
                        onClick={() => this.props.web3EstimateGas(this.props.contract, this.inputsAsArray())}>
                  Estimate
                </Button>
                <Button color="primary" disabled={this.actionDisabled()} onClick={() => this.props.web3Deploy(this.props.contract, this.inputsAsArray())}>Deploy</Button>
              </React.Fragment>
            }
          </Col>
          <Col md={5}>
            {this.props.gasEstimate && <GasEstimateResult gasEstimate={this.props.gasEstimate}/>}
            <hr />
            {this.props.deployment && <DeploymentResult deployment={this.props.deployment}/>}
          </Col>
        </Row>
      </LayoutContract>
    )
  }
}

const EmbarkContract = ({contract}) => (
  <LayoutContract contract={contract}>
    {contract.address &&
      <React.Fragment>
        <h5>{contract.className} deployed at {contract.address}</h5>
        <p><strong>Arguments:</strong> {JSON.stringify(contract.args)}</p>
      </React.Fragment>
    }
    {!contract.address &&
      <h5>{contract.className} not deployed</h5>
    }
    {contract.transactionHash &&
      <React.Fragment>
        <p><strong>Transaction Hash:</strong> {contract.transactionHash}</p>
        <p><strong>{contract.gas}</strong> gas at <strong>{contract.gasPrice}</strong> Wei, estimated cost: <strong>{contract.gas * contract.gasPrice}</strong> Wei</p>
      </React.Fragment>
    }
    {contract.address && !contract.transactionHash &&
      <p><strong>Contract already deployed</strong></p>
    }
  </LayoutContract>
);

const ContractsHeader = ({deploymentPipeline, updateDeploymentPipeline}) => (
  <Row className="mt-3">
    <Col xs={1} className="text-center">
      <strong>Order</strong>
    </Col>
    <Col xs={11}>
      <Row>
        <strong>Contract</strong>
        <div className="ml-auto mr-5">
          <FormGroup row>
            <span className="mr-2">Deploy using</span>
            <FormGroup check inline>
              <Label className="form-check-label" check>
                <Input className="form-check-input" 
                       type="radio" 
                       onChange={() => updateDeploymentPipeline(DEPLOYMENT_PIPELINES.embark)} 
                       checked={deploymentPipeline === DEPLOYMENT_PIPELINES.embark} />
                Embark
                <i className="ml-1 fa fa-question" id="embark-tooltip" />
                <UncontrolledTooltip placement="bottom" target="embark-tooltip">
                  Embark will deploy the contracts automatically for you each time there is a change in one of them.
                </UncontrolledTooltip>
              </Label>
            </FormGroup>
            <FormGroup check inline>
              <Label className="form-check-label" check>
                <Input className="form-check-input" 
                       type="radio" 
                       onChange={() => updateDeploymentPipeline(DEPLOYMENT_PIPELINES.injectedWeb3)} 
                       checked={deploymentPipeline === DEPLOYMENT_PIPELINES.injectedWeb3} />
                Injected Web3
                <i className="ml-1 fa fa-question" id="web3-tooltip" />
                <UncontrolledTooltip placement="bottom" target="web3-tooltip">
                  You will have full control on your deployment
                </UncontrolledTooltip>
              </Label>
            </FormGroup>
          </FormGroup>
        </div>
      </Row>
    </Col>
  </Row>
)

const Contract = ({web3, contract, deploymentPipeline, web3Deploy, web3EstimateGas, web3Deployments, web3GasEstimates}) => {
  const deployment = web3Deployments[contract.className];
  const gasEstimate = web3GasEstimates[contract.className];
  switch(deploymentPipeline) {
    case DEPLOYMENT_PIPELINES.embark:
      return <EmbarkContract contract={contract} />;
    case DEPLOYMENT_PIPELINES.injectedWeb3:
      return <Web3Contract web3={web3} 
                           deployment={deployment}
                           gasEstimate={gasEstimate}
                           contract={contract}
                           web3Deploy={web3Deploy}
                           web3EstimateGas={web3EstimateGas} />;
    default:
      return <React.Fragment></React.Fragment>;
  }
}

const Contracts = (props) => (
  <React.Fragment>
    <ContractsHeader deploymentPipeline={props.deploymentPipeline} updateDeploymentPipeline={props.updateDeploymentPipeline} />
    {props.contracts.sort((a, b) => a.index - b.index).map(contract => <Contract key={contract.index} contract={contract} {...props} />)}
  </React.Fragment>
);

Contracts.propTypes = {
  contracts: PropTypes.array,
  deploymentPipeline: PropTypes.string,
  updateDeploymentPipeline: PropTypes.func,
  web3Deployments: PropTypes.object,
  web3GasEstimates: PropTypes.object,
  web3: PropTypes.object,
  web3Deploy: PropTypes.func,
  web3EstimateGas: PropTypes.func
};

export default Contracts;

