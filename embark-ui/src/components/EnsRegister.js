import React, {Component} from 'react';
import {
  Alert,
  Button,
  Form, Grid
} from "tabler-react";
import PropTypes from 'prop-types';

class EnsRegister extends Component {
  constructor(props) {
    super(props);

    this.state = {
      subdomain: '',
      address: '',
      showResult: false
    };
  }

  handleChange(e, name) {
    this.setState({
      showResult: false,
      [name]: e.target.value
    });
  }

  handleRegister() {
    this.props.register(this.state.subdomain, this.state.address);
    this.setState({showResult: true});
  }

  showResult() {
    if (this.props.ensErrors) {
      return <Alert type="danger">An error happened: {this.props.ensErrors}</Alert>;
    } else {
      return <Alert type="success">Successfully registered</Alert>;
    }
  }

  render(){
    return (
      <React.Fragment>
        <h3>Register</h3>
        <Form.FieldSet>
          <Grid.Row>
            <Grid.Col md={6}>
              <Form.Group>
                <Form.Input placeholder="Enter a subdomain" onChange={e => this.handleChange(e, "subdomain")}/>
              </Form.Group>
            </Grid.Col>
            <Grid.Col md={6}>
              <Form.Group>
                <Form.Input placeholder="Enter an address" onChange={e => this.handleChange(e, "address")}/>
              </Form.Group>
            </Grid.Col>
          </Grid.Row>
          <Button color="primary" onClick={() => this.handleRegister()}>Register</Button>
        </Form.FieldSet>
        {this.state.showResult && this.showResult()}
      </React.Fragment>
    );
  }
}

EnsRegister.propTypes = {
  register: PropTypes.func,
  ensRecords: PropTypes.arrayOf(PropTypes.object),
  ensErrors: PropTypes.string
};

export default EnsRegister;
