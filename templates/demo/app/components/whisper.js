import EmbarkJS from 'Embark/EmbarkJS';
import React from 'react';
import { Alert, Form, FormGroup, FormControl, HelpBlock, Button } from 'react-bootstrap';
 
class Whisper extends React.Component {

    constructor(props) {
      super(props);

      this.state = {
          listenTo: '',
          channel: '',
          message: '',
          subscribedChannels: [],
          messageList: [],
          logs: []
      }
    }

    handleChange(e, name){
        this.state[name] = e.target.value;
        this.setState(this.state);
    }

    sendMessage(e){
        e.preventDefault();
        EmbarkJS.Messages.sendMessage({topic: this.state.channel, data: this.state.message});
        this.addToLog("EmbarkJS.Messages.sendMessage({topic: '" + this.state.channel + "', data: '" + this.state.message + "'})");
    }

    listenToChannel(e){
        e.preventDefault();

        this.state.subscribedChannels.push(`subscribed to ${this.state.listenTo} now try sending a message`);

        EmbarkJS.Messages.listenTo({topic: [this.state.listenTo]})
            .then(message => this.state.messageList.push(`channel: ${this.state.listenTo}  message: ${message}`))

        this.addToLog("EmbarkJS.Messages.listenTo({topic: ['" + this.state.listenTo + "']}).then(function(message) {})");
    }

    addToLog(txt){
        this.state.logs.push(txt);
        this.setState({logs: this.state.logs});
    }

    render(){
        return (
       <React.Fragment>
            {
                !this.props.enabled ?
                <React.Fragment>
                <Alert bsStyle="warning">The node you are using does not support Whisper</Alert>
                <Alert bsStyle="warning">The node uses an unsupported version of Whisper</Alert>
                </React.Fragment> : ''
            }
            <h3>Listen To channel</h3>
            <Form inline>
                <FormGroup>
                    <FormControl
                        type="text"
                        defaultValue={this.state.listenTo}
                        placeholder="channel"
                        onChange={e => this.handleChange(e, 'listenTo')} />
                    <Button bsStyle="primary" onClick={(e) => this.listenToChannel(e)}>Start Listening</Button>
                    <div id="subscribeList">
                    { this.state.subscribedChannels.map((item, i) => <p key={i}>{item}</p>) }
                    </div>
                    <p>messages received:</p>
                    <div id="messagesList">
                    { this.state.messageList.map((item, i) => <p key={i}>{item}</p>) }
                    </div>
                </FormGroup>
            </Form>

            <h3>Send Message</h3>
            <Form inline>
                <FormGroup>
                    <FormControl
                        type="text"
                        defaultValue={this.state.channel}
                        placeholder="channel"
                        onChange={e => this.handleChange(e, 'channel')} />
                    <FormControl
                        type="text"
                        defaultValue={this.state.message}
                        placeholder="message"
                        onChange={e => this.handleChange(e, 'message')} />
                    <Button bsStyle="primary" onClick={(e) => this.sendMessage(e)}>Send Message</Button>
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
