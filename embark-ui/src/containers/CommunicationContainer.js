import PropTypes from "prop-types";
import React, {Component} from 'react';
import connect from "react-redux/es/connect/connect";
import {Alert, Loader, Page} from 'tabler-react';
import {messageSend, messageListen, messageVersion} from "../actions";
import Communication from "../components/Communication";
import Loading from "../components/Loading";
import {getMessageVersion, getMessages, getMessageChannels} from "../reducers/selectors";

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
    if (this.props.messageVersion === undefined || this.props.messageVersion === null) {
      isEnabledMessage =
        <Alert bsStyle="secondary "><Loader/> Checking Whisper support, please wait</Alert>;
    } else if (!this.props.messageVersion) {
      isEnabledMessage = <Alert type="warning">The node you are using does not support Whisper</Alert>;
    } else if (this.props.messageVersion === -1) {
      isEnabledMessage = <Alert type="warning">The node uses an unsupported version of Whisper</Alert>;
    }

    if (!this.props.messages) {
      return <Loading/>;
    }
    return (
      <Page.Content title="Communication explorer">
        {isEnabledMessage}
        <Communication listenToMessages={(channel) => this.listenToChannel(channel)}
                       sendMessage={(channel, message) => this.sendMessage(channel, message)}
                       channels={this.props.messages}
                       subscriptions={this.props.messageChannels}/>
      </Page.Content>
    );
  }
}

CommunicationContainer.propTypes = {
  messageSend: PropTypes.func,
  messageListen: PropTypes.func,
  communicationVersion: PropTypes.func,
  messageVersion: PropTypes.number,
  messages: PropTypes.object,
  messageChannels: PropTypes.array
};

function mapStateToProps(state) {
  return {
    messages: getMessages(state),
    messageChannels: getMessageChannels(state),
    messageVersion: getMessageVersion(state)
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

