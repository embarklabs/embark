import PropTypes from "prop-types";
import React, {Component} from 'react';
import connect from "react-redux/es/connect/connect";
import {Alert, Loader, Page} from 'tabler-react';
import {messageSend, messageListen, messageVersion} from "../actions";
import Communication from "../components/Communication";

class CommunicationContainer extends Component {
  componentDidMount() {
    this.props.communicationVersion();
  }

  sendMessage(topic, message) {
    this.props.messageSend({topic, message});
  }

  listenToChannel(channel) {
    this.props.messageListen(channel);
  }

  render() {
    let isEnabledMessage = '';
    if (this.props.messages.version === undefined || this.props.messages.version === null) {
      isEnabledMessage =
        <Alert bsStyle="secondary "><Loader/> Checking Whisper support, please wait</Alert>;
    } else if (!this.props.messages.version) {
      isEnabledMessage = <Alert type="warning">The node you are using does not support Whisper</Alert>;
    } else if (this.props.messages.version === -1) {
      isEnabledMessage = <Alert type="warning">The node uses an unsupported version of Whisper</Alert>;
    }

    return (
      <Page.Content title="Communication explorer">
        {isEnabledMessage}
        <Communication listenToMessages={(channel) => this.listenToChannel(channel)}
                       sendMessage={(channel, message) => this.sendMessage(channel, message)}
                       channels={this.props.messages.channels}
                       subscriptions={this.props.messages.subscriptions}/>
      </Page.Content>
    );
  }
}

CommunicationContainer.propTypes = {
  messageSend: PropTypes.func,
  messageListen: PropTypes.func,
  communicationVersion: PropTypes.func,
  messages: PropTypes.object
};

function mapStateToProps(state) {
  return {
    messages: state.messages
  };
}

export default connect(
  mapStateToProps,
  {
    messageSend: messageSend.request,
    messageListen: messageListen.request,
    communicationVersion: messageVersion.request
  }
)(CommunicationContainer);

