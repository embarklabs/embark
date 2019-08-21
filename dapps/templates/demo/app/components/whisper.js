import EmbarkJS from 'Embark/EmbarkJS';
import React from 'react';
import {Alert, Form, FormGroup, Input, Button, FormText} from 'reactstrap';

class Whisper extends React.Component {

  constructor (props) {
    super(props);

    this.state = {
      listenTo: '',
      channel: '',
      message: '',
      subscribedChannels: [],
      channelIsValid: false,
      listenToChannelIsValid: false,
      messageList: [],
      logs: []
    };
  }

  handleChange (e, name) {
    this.state[name] = e.target.value;
    if (name === 'listenTo') {
      this.state.listenToChannelIsValid = this.isChannelValid(e.target.value);
    } else if (name === "channel") {
      this.state.channelIsValid = this.isChannelValid(e.target.value);
    }
    this.setState(this.state);
  }

  checkEnter(e, func) {
    if (e.key !== 'Enter') {
      return;
    }
    e.preventDefault();
    func.apply(this, [e]);
  }

  sendMessage (e) {
    e.preventDefault();
    EmbarkJS.Messages.sendMessage({topic: this.state.channel, data: this.state.message});
    this.addToLog("EmbarkJS.Messages.sendMessage({topic: '" + this.state.channel + "', data: '" + this.state.message + "'})");
  }

  listenToChannel (e) {
    e.preventDefault();

    const subscribedChannels = this.state.subscribedChannels;
    subscribedChannels.push(this.state.listenTo);
    this.setState({
      subscribedChannels
    });

    const messageList = this.state.messageList;
    EmbarkJS.Messages.listenTo({topic: [this.state.listenTo]}).subscribe(
      message => {
        messageList.push(<span>Channel: <b>{message.topic}</b> |  Message: <b>{message.data}</b></span>);
        this.setState({messageList});
      },
      error => {
        messageList.push(<span className="alert-danger">Error: {error.message || "Unknown Error"}</span>);
        this.setState({messageList});
      }
    );

    this.addToLog("EmbarkJS.Messages.listenTo({topic: ['" + this.state.listenTo + "']}).then(function(message) {})");
  }

  addToLog (txt) {
    this.state.logs.push(txt);
    this.setState({logs: this.state.logs});
  }

  isChannelValid(name) {
    return name.length >= 4;
  }

  render () {
    return (
      <React.Fragment>
        {
          !this.props.enabled &&
            <React.Fragment>
              <Alert color="warning">The node you are using does not support Whisper</Alert>
              <Alert color="warning">The node uses an unsupported version of Whisper</Alert>
            </React.Fragment>}
        <h3>Listen To channel</h3>
        <Form onKeyDown={(e) => this.checkEnter(e, this.listenToChannel)}>
          <FormGroup className="inline-input-btn">
            <Input
              type="text"
              defaultValue={this.state.listenTo}
              placeholder="channel"
              onChange={e => this.handleChange(e, 'listenTo')}/>
            <Button disabled={!this.state.listenToChannelIsValid} color="primary" onClick={(e) => this.listenToChannel(e)}>Start Listening</Button>
            {!this.state.listenToChannelIsValid && <FormText color="danger">Channel has to be at least 4 characters long</FormText>}
            <div id="subscribeList">
              {this.state.subscribedChannels.map((item, i) => <p key={i}><span>Subscribed to <b>{item}</b>. Now try sending a message</span></p>)}
            </div>
            <h5>Messages received:</h5>
            <div id="messagesList">
              {this.state.messageList.map((item, i) => <p key={i}>{item}</p>)}
            </div>
          </FormGroup>
        </Form>

        <h3>Send Message</h3>
        <Form inline onKeyDown={(e) => this.checkEnter(e, this.sendMessage)}>
          <FormGroup>
            <Input
              type="text"
              defaultValue={this.state.channel}
              placeholder="channel"
              onChange={e => this.handleChange(e, 'channel')}/>
            <div className="inline-input-btn m-0">
              <Input
                type="text"
                defaultValue={this.state.message}
                placeholder="message"
                onChange={e => this.handleChange(e, 'message')}/>
              <Button color="primary" disabled={!this.state.channelIsValid} onClick={(e) => this.sendMessage(e)}>Send
                Message</Button>
            </div>
          </FormGroup>
        </Form>

        <p>Javascript calls being made: </p>
        <div className="logs">
          <p>EmbarkJS.Messages.setProvider('whisper')</p>
          {
            this.state.logs.map((item, i) => <p key={i}>{item}</p>)
          }
        </div>
      </React.Fragment>
    );
  }
}

export default Whisper;
