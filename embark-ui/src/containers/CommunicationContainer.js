import PropTypes from "prop-types";
import React, {Component} from 'react';
import connect from "react-redux/es/connect/connect";
import {Alert, Icon, Page} from 'tabler-react';
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
    if (this.props.version === undefined || this.props.version === null) {
      isEnabledMessage =
        <Alert bsStyle="secondary "><Icon name="refresh-cw"/> Checking Whisper support, please wait</Alert>;
    } else if (!this.props.version) {
      isEnabledMessage = <Alert type="warning">The node you are using does not support Whisper</Alert>;
    } else if (this.props.version === -1) {
      isEnabledMessage = <Alert type="warning">The node uses an unsupported version of Whisper</Alert>;
    }

    return (
      <Page.Content title="Communication explorer">
        {isEnabledMessage}
        <Communication listenToMessages={(channel) => this.listenToChannel(channel)}
                       sendMessage={(channel, message) => this.sendMessage(channel, message)}
                       channels={this.props.channels}/>
      </Page.Content>
    );
  }
}

CommunicationContainer.propTypes = {
  messageSend: PropTypes.func,
  messageListen: PropTypes.func,
  communicationVersion: PropTypes.func,
  channels: PropTypes.object,
  version: PropTypes.number
};

function mapStateToProps(state) {
  return {
    channels: state.messages.channels,
    version: state.messages.version
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

