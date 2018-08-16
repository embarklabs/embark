import PropTypes from "prop-types";
import React, {Component} from 'react';
import {
  Page,
  Grid,
  Form,
  Button,
  Card
} from "tabler-react";

class ContractFunction extends Component {
  constructor(props) {
    super(props)
    this.state = { inputs: {} };
  }

  handleChange(e, name) {
    let newInputs = this.state.inputs;
    newInputs[name] = e.target.value;
    this.setState({ inputs: newInputs});
  }

  handleCall(e) {
    e.preventDefault();
    const inputs = this.props.method.inputs.map(input => this.state.inputs[input.name]);
    this.props.postContractFunction(this.props.contractProfile.name, this.props.method.name, inputs);
  }

  render() {
    return (
      <Grid.Row>
        <Grid.Col>
          <Card>
            <Card.Header>
              <Card.Title>{this.props.method.name}</Card.Title>
            </Card.Header>
            {this.props.method.inputs.length > 0 &&
            <Card.Body>
              {this.props.method.inputs.map(input => (
                <Form.Group key={input.name} label={input.name}>
                  <Form.Input placeholder={input.type} onChange={(e) => this.handleChange(e, input.name)}/>
                </Form.Group>
              ))}
            </Card.Body>
            }
            <Card.Footer>
              <Button color="primary" onClick={(e) => this.handleCall(e)}>Call</Button>
            </Card.Footer>
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

const ContractFunctions = (props) => {
  const {contractProfile} = props;
  return (
    <Page.Content title={contractProfile.name + ' Functions'}>
      {contractProfile.methods
        .filter(method => method.name !== 'constructor')
        .map(method => <ContractFunction key={method.name} method={method} {...props} />)}
    </Page.Content>
  )
};

ContractFunctions.propTypes = {
  contractProfile: PropTypes.object,
  contractFunctions: PropTypes.arrayOf(PropTypes.object),
  postContractFunction: PropTypes.func
};

export default ContractFunctions;

