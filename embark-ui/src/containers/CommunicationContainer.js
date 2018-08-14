import PropTypes from "prop-types";
import React, {Component} from 'react';
import connect from "react-redux/es/connect/connect";
import {Alert, Page} from 'tabler-react';
import {messageSend, messageListen} from "../actions";
import Communication from "../components/Communication";
import {getMessages, getMessageChannels, isOldWeb3, isWeb3Enabled} from "../reducers/selectors";

class CommunicationContainer extends Component {
  sendMessage(topic, message) {
    this.props.messageSend({topic, message});
  }

  listenToChannel(channel) {
    this.props.messageListen(channel);
  }

  web3DisabledWarning() {
    return <Alert type="warning">The node you are using does not support Whisper</Alert>
  }

  web3Enabled() {
    return this.props.isOldWeb3 ? this.web3DisabledWarning() : this.showCommunication();
  }

  web3OldWarning() {
    return <Alert type="warning">The node uses an unsupported version of Whisper</Alert>;
  }

  showCommunication() {
    return <Communication listenToMessages={(channel) => this.listenToChannel(channel)}
                          sendMessage={(channel, message) => this.sendMessage(channel, message)}
                          channels={this.props.messages}
                          subscriptions={this.props.messageChannels}/>;
  }

  render() {
    return (
      <Page.Content title="Communication explorer">
        {this.props.isWeb3Enabled ? this.web3Enabled() : this.web3DisabledWarning()}
      </Page.Content>
    );
  }
}

CommunicationContainer.propTypes = {
  messageSend: PropTypes.func,
  messageListen: PropTypes.func,
  isOldWeb3: PropTypes.bool,
  isWeb3Enabled: PropTypes.bool,
  messages: PropTypes.object,
  messageChannels: PropTypes.array
};

function mapStateToProps(state) {
  return {
    messages: getMessages(state),
    messageChannels: getMessageChannels(state),
    isOldWeb3: isOldWeb3(state),
    isWeb3Enabled: isWeb3Enabled(state)
  };
}

export default connect(
  mapStateToProps,
  {
    messageSend: messageSend.request,
    messageListen: messageListen.request,
  }
)(CommunicationContainer);

