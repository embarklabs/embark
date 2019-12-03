import PropTypes from "prop-types";
import React, { Component } from 'react';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Col,
  FormGroup,
  Input,
  Row,
  Label,
  ListGroup,
  ListGroupItem
} from 'reactstrap';
import Error from "./Error";

class Communication extends Component {
  constructor(props) {
    super(props);

    this.state = {
      listenTo: '',
      channel: '',
      channelIsValid: false,
      listenToChannelIsValid: false,
      message: '',
      messageList: []
    };
  }

  handleChange(e, name) {
    this.setState({
      [name]: e.target.value
    });

    if (name === "channel") {
      this.setState({channelIsValid: this.isChannelValid(e.target.value)});
    } else if (name === "listenTo") {
      this.setState({listenToChannelIsValid: this.isChannelValid(e.target.value)});
    }
  }

  handleEnter(e, cb) {
    if (e.key === 'Enter') {
      e.preventDefault();
      cb(e);
    }
  }

  sendMessage(e) {
    e.preventDefault();
    this.props.sendMessage(this.state.channel, this.state.message);
  }

  listenToChannel(e) {
    e.preventDefault();
    this.props.listenToMessages(this.state.listenTo);
  }

  render() {
    return (
      <Row className="justify-content-md-center">
        <Col xs="12" sm="9" lg="9">
          {this.props.error && this.props.error.error && <Error error={this.props.error.error} />}
          <Card>
            <CardHeader>
              <strong>Listen to channel</strong>
            </CardHeader>
            <CardBody>
              <FormGroup>
                <Label htmlFor="listenTo">Whisper channel</Label>
                <Input id="listenTo"
                  placeholder="Channel"
                  value={this.state.listenTo}
                  onChange={e => this.handleChange(e, 'listenTo')}
                  onKeyPress={e => this.handleEnter(e, this.listenToChannel.bind(this))} />
              </FormGroup>
              <Button disabled={!this.state.listenToChannelIsValid} color="primary" onClick={(e) => this.listenToChannel(e)}>Start Listening</Button>

              {this.props.subscriptions && this.props.subscriptions.length > 0 &&
              <React.Fragment>
                <h4>Subscribed channels:</h4>
                <ListGroup>
                  {this.props.subscriptions.map((item, i) => <ListGroupItem key={i}>{item}</ListGroupItem>)}
                </ListGroup>
              </React.Fragment>
              }

              {this.props.channels && Boolean(Object.keys(this.props.channels).length) &&
              <React.Fragment>
                <h4>Messages received:</h4>

                <Row>
                  {Object.keys(this.props.channels).map((channelName, i) => {
                    return (<Col md={4} key={`message-${i}`}>
                      <Card>
                        <CardHeader>
                          <strong>{channelName}</strong>
                        </CardHeader>
                        <CardBody>
                          {this.props.channels[channelName].map((data, f) => {
                            return <p key={`message-${i}-${f}`}>{data.message}</p>;
                          })}
                        </CardBody>
                      </Card>
                    </Col>);
                  })}
                </Row>
              </React.Fragment>
              }
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <strong>Send message</strong>
            </CardHeader>
            <CardBody>
              <FormGroup label="Whisper channel">
                <Label htmlFor="sendChannel">Whisper channel</Label>
                <Input value={this.state.channel}
                      id="sendChannel"
                      placeholder="Channel"
                      onChange={e => this.handleChange(e, 'channel')}/>
              </FormGroup>
              <FormGroup label="Message">
                <Label htmlFor="message">Message</Label>
                <Input value={this.state.message}
                      placeholder="Message"
                      id="message"
                      onChange={e => this.handleChange(e, 'message')}
                      onKeyPress={e => this.handleEnter(e, this.sendMessage.bind(this))}/>
              </FormGroup>
              <Button color="primary" disabled={!this.state.channelIsValid} onClick={(e) => this.sendMessage(e)}>Send Message</Button>

            </CardBody>
          </Card>
        </Col>
      </Row>
    );
  }

  isChannelValid(channelName) {
    return channelName.length >= 4;
  }
}

Communication.propTypes = {
  sendMessage: PropTypes.func,
  listenToMessages: PropTypes.func,
  subscriptions: PropTypes.array,
  channels: PropTypes.object,
  error: PropTypes.object
};

export default Communication;

