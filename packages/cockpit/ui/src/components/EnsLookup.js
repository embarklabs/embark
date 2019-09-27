import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  FormGroup,
  Input,
  Button,
  Card,
  CardHeader,
  CardBody
} from 'reactstrap';

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
      return <Alert className="mt-3" color="success">The name is: {ensRecord.name}</Alert>;
    } else {
      return <Alert className="mt-3" color="danger">We could not find a name for this address</Alert>;
    }
  }

  render(){
    return (
      <Card>
        <CardHeader>
          <strong>ENS Lookup</strong>
        </CardHeader>
        <CardBody>
          <FormGroup>
            <Input placeholder="Enter an address (0x...)" onChange={e => this.handleChange(e)}/>
          </FormGroup>
          <Button color="primary" onClick={() => this.handleLookup()}>Lookup</Button>
          {this.state.showResult && this.showResult()}
        </CardBody>
      </Card>
    );
  }
}

EnsLookup.propTypes = {
  lookup: PropTypes.func,
  ensRecords: PropTypes.arrayOf(PropTypes.object)
};

export default EnsLookup;
