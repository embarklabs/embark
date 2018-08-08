import PropTypes from "prop-types";
import React, {Component} from 'react';
import connect from "react-redux/es/connect/connect";
import {Alert, Button, Form, Icon} from 'tabler-react';
import {messageSend, messageListen} from "../actions";

class CommunicationContainer extends Component {
  constructor(props) {
    super(props);

    this.state = {
      listenTo: '',
      channel: '',
      message: '',
      subscribedChannels: [],
      messageList: [],
      logs: []
    };
  }

  handleChange(e, name) {
    this.setState({
      [name]: e.target.value
    });
  }

  sendMessage(e) {
    e.preventDefault();
    this.props.messageSend({topic: this.state.channel, message: this.state.message});
    this.addToLog("EmbarkJS.Messages.sendMessage({topic: '" + this.state.channel + "', data: '" + this.state.message + "'})");
  }

  listenToChannel(e) {
    e.preventDefault();

    const subscribedChannels = this.state.subscribedChannels;
    subscribedChannels.push(<span>Subscribed to <b>{this.state.listenTo}</b>. Now try sending a message</span>);
    this.setState({
      subscribedChannels
    });

    this.props.messageListen(this.state.listenTo);
    this.addToLog("EmbarkJS.Messages.listenTo({topic: ['" + this.state.listenTo + "']}).then(function(message) {})");
  }

  addToLog(txt) {
    this.state.logs.push(txt);
    this.setState({logs: this.state.logs});
  }

  render() {
    let isEnabledMessage = '';
    if (this.enabled === false) {
      isEnabledMessage = <React.Fragment>
        <Alert type="warning">The node you are using does not support Whisper</Alert>
        <Alert type="warning">The node uses an unsupported version of Whisper</Alert>
      </React.Fragment>;
    } else if (!this.enabled) {
      isEnabledMessage = <Alert bsStyle="secondary "><Icon name="refresh-cw" /> Checking Whisper support, please wait</Alert>;
    }

    return (
      <React.Fragment>
        {isEnabledMessage}
        <h3>Listen To channel</h3>
        <Form.FieldSet>
          <Form.Group label="Whisper channel" isRequired>
            <Form.Input name="text-input"
                        defaultValue={this.state.listenTo}
                        placeholder="channel"
                        onChange={e => this.handleChange(e, 'listenTo')}/>
          </Form.Group>
          <Button color="primary" onClick={(e) => this.listenToChannel(e)}>Start Listening</Button>
          <div id="subscribeList">
            {this.state.subscribedChannels.map((item, i) => <p key={i}>{item}</p>)}
          </div>
          {this.props.messages && this.props.messages.channels && this.props.messages.channels.length &&
          <React.Fragment>
            <p>Messages received:</p>
            <div id="messagesList">
              {Object.keys(this.props.messages.channels).map((channelName, i) => {
                return (<React.Fragment key={'channel-' + i}>
                  <p><b>{channelName}</b></p>
                  {this.props.messages.channels[channelName].messages.map((message, f) => {
                    return <p key={`${message}-${i}-${f}`}>{message}</p>;
                  })}
                </React.Fragment>);
              })}
            </div>
          </React.Fragment>
          }
        </Form.FieldSet>

        <h3>Send Message</h3>

        <Form.FieldSet>
          <Form.Group label="Whisper channel" isRequired>
            <Form.Input name="text-input"
                        defaultValue={this.state.channel}
                        placeholder="channel"
                        onChange={e => this.handleChange(e, 'channel')}/>
          </Form.Group>
          <Form.Group label="Message" isRequired>
            <Form.Input name="text-input"
                        defaultValue={this.state.message}
                        placeholder="message"
                        onChange={e => this.handleChange(e, 'message')}/>
          </Form.Group>
          <Button color="primary" onClick={(e) => this.sendMessage(e)}>Send Message</Button>

        </Form.FieldSet>

        <p>Javascript calls being made: </p>
        <div className="logs">
          <p>EmbarkJS.Messages.setProvider&#x00028;&apos;whisper&apos;&#x00029;</p>
          {
            this.state.logs.map((item, i) => <p key={i}>{item}</p>)
          }
        </div>
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

