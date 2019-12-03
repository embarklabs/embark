import PropTypes from "prop-types";
import React, {Component} from 'react';
import connect from "react-redux/es/connect/connect";
import { Alert } from 'reactstrap';
import {messageSend, messageListen, versions} from "../actions";
import Communication from "../components/Communication";
import PageHead from "../components/PageHead";
import { getMessages, getMessageChannels, isOldWeb3, isWeb3Enabled, getMessagesError } from "../reducers/selectors";

class CommunicationContainer extends Component {
  componentDidMount() {
    this.props.fetchVersions();
  }

  sendMessage(topic, message) {
    this.props.messageSend({topic, message});
  }

  listenToChannel(channel) {
    this.props.messageListen(channel);
  }

  web3DisabledWarning() {
    return <Alert color="danger">The node you are using does not support Whisper</Alert>;
  }

  web3Enabled() {
    return this.props.isOldWeb3 ? this.web3DisabledWarning() : this.showCommunication();
  }

  web3OldWarning() {
    return <Alert color="danger">The node uses an unsupported version of Whisper</Alert>;
  }

  showCommunication() {
    return (
      <React.Fragment>
        <PageHead title="Communication" description="Interact with the decentralised communication protocols configured for Embark (ie Whisper)" />
        <Communication listenToMessages={(channel) => this.listenToChannel(channel)}
          sendMessage={(channel, message) => this.sendMessage(channel, message)}
          channels={this.props.messages}
          subscriptions={this.props.messageChannels}
          error={this.props.error}
        />
      </React.Fragment>
    );
  }

  render() {
    return (
      <React.Fragment>
        {this.props.isWeb3Enabled ? this.web3Enabled() : this.web3DisabledWarning()}
      </React.Fragment>
    );
  }
}

CommunicationContainer.propTypes = {
  messageSend: PropTypes.func,
  messageListen: PropTypes.func,
  isOldWeb3: PropTypes.bool,
  isWeb3Enabled: PropTypes.bool,
  messages: PropTypes.object,
  messageChannels: PropTypes.array,
  fetchVersions: PropTypes.func,
  error: PropTypes.object
};

function mapStateToProps(state) {
  return {
    messages: getMessages(state),
    messageChannels: getMessageChannels(state),
    isOldWeb3: isOldWeb3(state),
    isWeb3Enabled: isWeb3Enabled(state),
    error: getMessagesError(state)
  };
}

export default connect(
  mapStateToProps,
  {
    messageSend: messageSend.request,
    messageListen: messageListen.request,
    fetchVersions: versions.request
  }
)(CommunicationContainer);
