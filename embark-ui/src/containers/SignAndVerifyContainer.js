import React, { Component }  from 'react';
import {connect} from 'react-redux';
import SignAndVerify from '../components/SignAndVerify';
import {
  accounts as accountsAction,
  signMessage as signMessageAction,
  verifyMessage as verifyMessageAction
} from '../actions';
import {getAccounts} from "../reducers/selectors";
import {
  getMessageSignaturePayload,
  getMessageSignaturePendingState,
  getMessageSignatureError,
  getVerifiedAddressPayload,
  getVerificationPendingState,
  getVerificationError
} from '../reducers/selectors';

class SignAndVerifyContainer extends Component {

  componentDidMount() {
    this.props.fetchAccounts();
  }

  render() {
    return (
      <React.Fragment>
        {this.props.accounts.length &&
          <SignAndVerify accounts={this.props.accounts}
                         signMessage={this.props.signMessage}
                         verifyMessage={this.props.verifyMessage}
                         signedMessage={this.props.signedMessage}
                         verifiedAddress={this.props.verifiedAddress}
                         signaturePending={this.props.signaturePending}
                         signatureError={this.props.signatureError}
                         verificationPending={this.props.verificationPending}
                         verificationError={this.props.verificationError}/>}
      </React.Fragment>
    )
  }
}

function mapStateToProps(state) {
  return {
    accounts: getAccounts(state),
    signedMessage: getMessageSignaturePayload(state),
    verifiedAddress: getVerifiedAddressPayload(state),
    signaturePending: getMessageSignaturePendingState(state),
    signatureError: getMessageSignatureError(state),
    verificationPending: getVerificationPendingState(state),
    verificationError: getVerificationError(state)
  };
}

export default connect(
  mapStateToProps,
  {
    fetchAccounts: accountsAction.request,
    signMessage: signMessageAction.request,
    verifyMessage: verifyMessageAction.request
  }
)(SignAndVerifyContainer);
