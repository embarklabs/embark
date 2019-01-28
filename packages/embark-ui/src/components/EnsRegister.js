import React, {Component} from 'react';
import {
  Alert,
  Button,
  FormGroup,
  Input,
  Row,
  Col,
  Card,
  CardHeader,
  CardBody
} from "reactstrap";
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
      return <Alert className="mt-3" color="danger">An error happened: {this.props.ensErrors}</Alert>;
    } else {
      return <Alert className="mt-3" color="success">Successfully registered</Alert>;
    }
  }

  render(){
    return (
      <Card>
        <CardHeader>
          <strong>ENS Register</strong>
        </CardHeader>
        <CardBody>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Input placeholder="Enter a subdomain" onChange={e => this.handleChange(e, "subdomain")}/>
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Input placeholder="Enter an address" onChange={e => this.handleChange(e, "address")}/>
              </FormGroup>
            </Col>
          </Row>
          <Button color="primary" onClick={() => this.handleRegister()}>Register</Button>
        {this.state.showResult && this.showResult()}
        </CardBody>
      </Card>
    );
  }
}

EnsRegister.propTypes = {
  register: PropTypes.func,
  ensRecords: PropTypes.arrayOf(PropTypes.object),
  ensErrors: PropTypes.string
};

export default EnsRegister;
