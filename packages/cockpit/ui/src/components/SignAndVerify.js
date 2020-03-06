import PropTypes from 'prop-types';
import React from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Row,
  Col,
  FormGroup,
  Input,
  Label,
  Button,
  Alert
} from 'reactstrap';

class SignAndVerify extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedAccount: this.props.accounts[0].address,
      messageToSign: '',
      messageToVerify: ''
    };
  }

  handleAccountChange(event) {
    const selectedAccount = event.target.value;
    this.setState({...this.state, selectedAccount});
  }

  handleMessageChange(event) {
    const messageToSign = event.target.value;
    this.setState({...this.state, messageToSign});
  }

  handleSignatureChange(event) {
    const messageToVerify = event.target.value;
    this.setState({...this.state, messageToVerify});
  }

  render() {
    return (
      <Row className="justify-content-md-center">
        <Col xs="12" sm="9" lg="6">
          <Card>
            <CardHeader>
              <strong>Sign Message</strong>
            </CardHeader>
            <CardBody>
              <FormGroup>
                <Label for="account">Select account</Label>
                <Input type="select" name="select" id="account" defaultValue={this.state.selectedAccount} onChange={e => this.handleAccountChange(e)}>
                  {this.props.accounts.map(account => <option key={account.address}>{account.address}</option>)}
                </Input>
              </FormGroup>

              <FormGroup>
                <Label for="messageToSign">Message</Label>
                <Input type="textarea" name="messageToSign" placeholder="Enter message" id="messageToSign" value={this.state.messageToSign} onChange={e => this.handleMessageChange(e)}/>
              </FormGroup>
              <Button type="button"
                      color="primary"
                      onClick={e => this.props.signMessage(this.state.messageToSign, this.state.selectedAccount)}
                      disabled={this.props.signaturePending}>Sign Message</Button> {this.props.signaturePending && <i className="fa fa-spinner fa-spin fa-fw"/>}

              {this.props.signedMessage &&
                <Alert className="mt-3" color="info">
                  <p>Message signed! Your signature:</p>
                  <pre>{this.props.signedMessage}</pre>
                </Alert>}

              {this.props.signatureError && <Alert className="mt-3" color="danger">Whoops! Something went wrong: {this.props.signatureError}</Alert>}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <strong>Verify Message</strong>
            </CardHeader>
            <CardBody>
              <FormGroup>
                <Label for="messageToVerify">Message</Label>
                <Input type="textarea" name="messageToVerify" placeholder="Enter signed message" id="messageToVerify" value={this.state.messageToVerify} onChange={e => this.handleSignatureChange(e)}/>
              </FormGroup>
              <Button type="button"
                      color="primary"
                      onClick={e => this.props.verifyMessage(this.state.messageToVerify)}
                      disabled={this.props.verificationPending}>Verify Message</Button> {this.props.verificationPending && <i className="fa fa-spinner fa-spin fa-fw"/>}

              {this.props.verifiedAddress && <Alert className="mt-3" color="success"><p>Verified! Message was signed by:</p> {this.props.verifiedAddress}</Alert>}
              {this.props.verificationError && <Alert className="mt-3" color="danger">Whoops! Something went wrong: {this.props.verificationError}</Alert>}
            </CardBody>
          </Card>
        </Col>
      </Row>
    )
  }
}

SignAndVerify.propTypes = {
  accounts: PropTypes.array,
  signMessage: PropTypes.func,
  signatureError: PropTypes.string,
  signaturePending: PropTypes.bool,
  signedMessage: PropTypes.string,
  verificationError: PropTypes.string,
  verificationPending: PropTypes.bool,
  verifiedAddress: PropTypes.string,
  verifyMessage: PropTypes.func
};

export default SignAndVerify;
