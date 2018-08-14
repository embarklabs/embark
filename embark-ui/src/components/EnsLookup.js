import React, {Component} from 'react';
import {
  Alert,
  Button,
  Form
} from "tabler-react";
import PropTypes from 'prop-types';

class EnsLookup extends Component {
  constructor(props) {
    super(props);

    this.state = {
      address: '',
      showResult: false
    };
  }

  handleChange(e) {
    this.setState({address: e.target.value, showResult: false});
  }

  handleLookup() {
    this.setState({showResult: true});
    this.props.lookup(this.state.address);
  }

  showResult() {
    let ensRecord = this.props.ensRecords.find((record) => record.address === this.state.address);
    if (ensRecord) {
      return <Alert type="success">The subdomain is: {ensRecord.subdomain}</Alert>;
    } else {
      return <Alert type="danger">We could not find a subdomain for this address</Alert>;
    }
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
          {this.state.showResult && this.showResult()}
        </Form.FieldSet>
      </React.Fragment>
    );
  }
}

EnsLookup.propTypes = {
  lookup: PropTypes.func,
  ensRecords: PropTypes.arrayOf(PropTypes.object)
};

export default EnsLookup;
