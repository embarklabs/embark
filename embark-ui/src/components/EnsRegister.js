import React, {Component} from 'react';
import {
  Button,
  Form, Grid
} from "tabler-react";
import PropTypes from 'prop-types';

class EnsRegister extends Component {
  constructor(props) {
    super(props);

    this.state = {
      name: '',
      address: ''
    };
  }

  handleChange(e, name) {
    this.setState({
      [name]: e.target.value
    });
  }

  handleRegister() {
    this.props.register(this.state.name, this.state.address);
  }

  render(){
    return (
      <React.Fragment>
        <h3>Register</h3>
        <Form.FieldSet>
          <Grid.Row>
            <Grid.Col md={6}>
              <Form.Group>
                <Form.Input placeholder="Enter a name" onChange={e => this.handleChange(e, "name")}/>
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
      </React.Fragment>
    );
  }
}

EnsRegister.propTypes = {
  register: PropTypes.func
};

export default EnsRegister;
