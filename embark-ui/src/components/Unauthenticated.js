import PropTypes from "prop-types";
import React from 'react';
import {Page, Alert, Form, Button} from "tabler-react";

class Unauthenticated extends React.Component {
  constructor(props){
    super(props);
    this.state = props.credentials;
  }

  handleChange(event){
    this.setState({[event.target.name]: event.target.value});
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.authenticate(this.state.host, this.state.token);
  }

  render() {
    return (
      <Page.Content>
        {this.props.error && <Alert type="danger">
          {this.props.error}
        </Alert>}
        <Form  onSubmit={(e) => this.handleSubmit(e)}>
          <Form.Input name="host"
                      label="Embark Host"
                      value={this.state.host}
                      onChange={(e) => this.handleChange(e)}
                      placeholder="Enter Embark Host"/>
          <Form.Input name="token"
                      label="Token"
                      value={this.state.token}
                      onChange={(e) => this.handleChange(e)}
                      placeholder="Enter Token"/>
          <Button type="submit" color="primary">
            Authenticate
          </Button>
        </Form>
      </Page.Content>
    );
  } 
}

Unauthenticated.propTypes = {
  authenticate: PropTypes.func,
  credentials: PropTypes.object,
  error: PropTypes.string
};

export default Unauthenticated;

