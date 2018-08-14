import React, {Component} from 'react';
import {
  Alert,
  Button,
  Form
} from "tabler-react";
import PropTypes from 'prop-types';

class EnsResolve extends Component {
  constructor(props) {
    super(props);

    this.state = {
      subdomain: '',
      showResult: false
    };
  }

  handleChange(e) {
    this.setState({subdomain: e.target.value, showResult: false});
  }

  handleResolve() {
    this.setState({showResult: true});
    this.props.resolve(this.state.subdomain);
  }

  showResult() {
    let ensRecord = this.props.ensRecords.find((record) => record.subdomain === this.state.subdomain);
    if (ensRecord) {
      return <Alert type="success">The address is: {ensRecord.address}</Alert>;
    } else {
      return <Alert type="danger">We could not find an address for this subdomain</Alert>;
    }
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
          {this.state.showResult && this.showResult()}
        </Form.FieldSet>
      </React.Fragment>
    );
  }
}

EnsResolve.propTypes = {
  resolve: PropTypes.func,
  ensRecords: PropTypes.arrayOf(PropTypes.object)
};

export default EnsResolve;
