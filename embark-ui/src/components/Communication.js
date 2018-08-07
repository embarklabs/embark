import PropTypes from "prop-types";
import React, {Component} from 'react';
import {Button, Form, Card, Grid, List} from 'tabler-react';

class Communication extends Component {
  constructor(props) {
    super(props);

    this.state = {
      listenTo: '',
      channel: '',
      message: '',
      subscribedChannels: [],
      messageList: []
    };
  }

  handleChange(e, name) {
    this.setState({
      [name]: e.target.value
    });
  }

  sendMessage(e) {
    e.preventDefault();
    this.props.sendMessage(this.state.channel, this.state.message);
  }

  listenToChannel(e) {
    e.preventDefault();

    const subscribedChannels = this.state.subscribedChannels;
    subscribedChannels.push(this.state.listenTo);
    this.setState({
      subscribedChannels
    });

    this.props.listenToMessages(this.state.listenTo);
  }

  render() {
    return (
      <React.Fragment>
        <h3>Listen To channel</h3>
        <Form.FieldSet>
          <Form.Group label="Whisper channel" isRequired>
            <Form.Input name="text-input"
                        defaultValue={this.state.listenTo}
                        placeholder="channel"
                        onChange={e => this.handleChange(e, 'listenTo')}/>
          </Form.Group>
          <Button color="primary" onClick={(e) => this.listenToChannel(e)}>Start Listening</Button>
        </Form.FieldSet>

        {this.state.subscribedChannels.length > 0 &&
        <div id="subscribeList">
          <h4>Subscribed channels:</h4>
          <List>
            {this.state.subscribedChannels.map((item, i) => <List.Item key={i}>{item}</List.Item>)}
          </List>
        </div>
        }

        {this.props.channels && Boolean(Object.keys(this.props.channels).length) &&
        <React.Fragment>
          <h4>Messages received:</h4>

          <Grid.Row messagesList>
            {Object.keys(this.props.channels).map((channelName, i) => {
              return (<Grid.Col md={4} key={`message-${i}`}>
                <Card title={channelName}>
                  <Card.Body>
                    {this.props.channels[channelName].messages.map((message, f) => {
                      return <p key={`message-${i}-${f}`}>{message}</p>;
                    })}
                  </Card.Body>
                </Card>
              </Grid.Col>);
            })}
          </Grid.Row>
        </React.Fragment>
        }

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
      </React.Fragment>
    );
  }
}

Communication.propTypes = {
  sendMessage: PropTypes.func,
  listenToMessages: PropTypes.func,
  channels: PropTypes.object
};

export default Communication;

