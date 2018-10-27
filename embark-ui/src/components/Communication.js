import PropTypes from "prop-types";
import React, {Component} from 'react';
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

class Communication extends Component {
  constructor(props) {
    super(props);

    this.state = {
      listenTo: '',
      channel: '',
      message: '',
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
    this.props.listenToMessages(this.state.listenTo);
  }

  render() {
    return (
      <Row className="justify-content-md-center">
        <Col xs="12" sm="9" lg="9">
          <Card>
            <CardHeader>
              <strong>Listen to channel</strong>
            </CardHeader>
            <CardBody>
              <FormGroup>
                <Label htmlFor="listenTo">Whisper channel</Label>
                <Input id="listenTo" placeholder="Channel" value={this.state.listenTo} onChange={e => this.handleChange(e, 'listenTo')} />
              </FormGroup>
              <Button color="primary" onClick={(e) => this.listenToChannel(e)}>Start Listening</Button>

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
                      onChange={e => this.handleChange(e, 'message')}/>
              </FormGroup>
              <Button color="primary" onClick={(e) => this.sendMessage(e)}>Send Message</Button>

            </CardBody>
          </Card>
        </Col>
      </Row>
    );
  }
}

Communication.propTypes = {
  sendMessage: PropTypes.func,
  listenToMessages: PropTypes.func,
  subscriptions: PropTypes.array,
  channels: PropTypes.object
};

export default Communication;

