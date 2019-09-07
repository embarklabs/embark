import React, {Component} from 'react';
import {
  Alert,
  Button,
  FormGroup,
  Input,
  Card,
  CardHeader,
  CardBody
} from "reactstrap";
import PropTypes from 'prop-types';

class EnsResolve extends Component {
  constructor(props) {
    super(props);

    this.state = {
      name: '',
      showResult: false
    };
  }

  handleChange(e) {
    this.setState({name: e.target.value, showResult: false});
  }

  handleResolve() {
    this.setState({showResult: true});
    this.props.resolve(this.state.name);
  }

  showResult() {
    let ensRecord = this.props.ensRecords.find((record) => record.name === this.state.name);
    if (ensRecord) {
      return <Alert className="mt-3" color="success">The address is: {ensRecord.address}</Alert>;
    } else {
      return <Alert className="mt-3" color="danger">We could not find an address for this name</Alert>;
    }
  }

  render(){
    return (
      <Card>
        <CardHeader>
          <strong>ENS Resolver</strong>
        </CardHeader>
        <CardBody>
          <FormGroup>
            <Input placeholder="Enter a name (e.g embark.eth)" onChange={e => this.handleChange(e)}/>
          </FormGroup>
          <Button color="primary" onClick={() => this.handleResolve()}>Resolve</Button>
          {this.state.showResult && this.showResult()}
        </CardBody>
      </Card>
    );
  }
}

EnsResolve.propTypes = {
  resolve: PropTypes.func,
  ensRecords: PropTypes.arrayOf(PropTypes.object)
};

export default EnsResolve;
