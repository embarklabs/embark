import PropTypes from "prop-types";
import React, {Component} from 'react';
import connect from "react-redux/es/connect/connect";
import {Alert, Icon} from 'tabler-react';
import {messageSend, messageListen} from "../actions";
import Communication from "../components/Communication";

class CommunicationContainer extends Component {
  sendMessage(topic, message) {
    this.props.messageSend({topic, message});
  }

  listenToChannel(channel) {
    this.props.messageListen(channel);
  }

  render() {
    let isEnabledMessage = '';
    if (this.enabled === false) {
      isEnabledMessage = <React.Fragment>
        <Alert type="warning">The node you are using does not support Whisper</Alert>
        <Alert type="warning">The node uses an unsupported version of Whisper</Alert>
      </React.Fragment>;
    } else if (!this.enabled) {
      isEnabledMessage =
        <Alert bsStyle="secondary "><Icon name="refresh-cw"/> Checking Whisper support, please wait</Alert>;
    }

    return (
      <React.Fragment>
        {isEnabledMessage}
        <Communication listenToMessages={(channel) => this.listenToChannel(channel)}
                       sendMessage={(channel, message) => this.sendMessage(channel, message)}
                       messages={this.props.messages}/>
      </React.Fragment>
    );
  }
}

CommunicationContainer.propTypes = {
  messageSend: PropTypes.func,
  messageListen: PropTypes.func,
  messages: PropTypes.object
};

function mapStateToProps(state) {
  return {messages: state.messages};
}

export default connect(
  mapStateToProps,
  {
    messageSend: messageSend.request,
    messageListen: messageListen.request
  }
)(CommunicationContainer);

