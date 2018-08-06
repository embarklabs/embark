import React, {Component} from 'react';
import {Alert, Button, Form, Icon} from 'tabler-react';

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
    // TODO send message via API
    console.log('Send', this.state.message);
    this.addToLog("EmbarkJS.Messages.sendMessage({topic: '" + this.state.channel + "', data: '" + this.state.message + "'})");
  }

  listenToChannel(e) {
    e.preventDefault();

    const subscribedChannels = this.state.subscribedChannels;
    subscribedChannels.push(<span>Subscribed to <b>{this.state.listenTo}</b>. Now try sending a message</span>);
    this.setState({
      subscribedChannels
    });

    console.log('Listen to', this.state.listenTo);
    // TODO listen to channel via API
    /*EmbarkJS.Messages.listenTo({topic: [this.state.listenTo]}, (error, message) => {
      const messageList = this.state.messageList;
      if (error) {
        messageList.push(<span className="alert-danger">Error: {error}</span>);
      } else {
        messageList.push(<span>Channel: <b>{message.topic}</b> |  Message: <b>{message.data}</b></span>);
      }
      this.setState({
        messageList
      });
    });*/

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
          <p>Messages received:</p>
          <div id="messagesList">
            {this.state.messageList.map((item, i) => <p key={i}>{item}</p>)}
          </div>
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

export default CommunicationContainer;
