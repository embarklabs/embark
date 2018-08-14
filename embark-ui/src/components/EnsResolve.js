import React, {Component} from 'react';
import {
  Button,
  Form
} from "tabler-react";
import PropTypes from 'prop-types';

class EnsResolve extends Component {
  constructor(props) {
    super(props);

    this.state = {
      name: ''
    };
  }

  handleChange(e) {
    this.setState({name: e.target.value});
  }

  handleResolve() {
    this.props.resolve(this.state.name);
  }

  render(){
    return (
      <React.Fragment>
        <h3>Resolve</h3>
        <Form.FieldSet>
          <Form.Group>
            <Form.Input placeholder="Enter a name" onChange={e => this.handleChange(e)}/>
          </Form.Group>
          <Button color="primary" onClick={() => this.handleResolve()}>Resolve</Button>
        </Form.FieldSet>
      </React.Fragment>
    );
  }
}

EnsResolve.propTypes = {
  resolve: PropTypes.func
};

export default EnsResolve;
