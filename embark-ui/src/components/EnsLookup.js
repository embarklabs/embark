import React, {Component} from 'react';
import {
  Button,
  Form
} from "tabler-react";
import PropTypes from 'prop-types';

class EnsLookup extends Component {
  constructor(props) {
    super(props);

    this.state = {
      address: ''
    };
  }

  handleChange(e) {
    this.setState({address: e.target.value});
  }

  handleLookup() {
    this.props.lookup(this.state.address);
  }

  render(){
    return (
      <React.Fragment>
        <h3>Lookup</h3>
        <Form.FieldSet>
          <Form.Group>
            <Form.Input placeholder="Enter an address" onChange={e => this.handleChange(e)}/>
          </Form.Group>
          <Button color="primary" onClick={() => this.handleLookup()}>Lookup</Button>
        </Form.FieldSet>
      </React.Fragment>
    );
  }
}

EnsLookup.propTypes = {
  lookup: PropTypes.func
};

export default EnsLookup;
