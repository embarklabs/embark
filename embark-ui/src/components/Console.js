import PropTypes from "prop-types";
import React, {Component} from 'react';
import {Grid, Card, Form} from 'tabler-react';

require('./Console.css');

const CommandResult = ({result}) => (
  <p className="text__new-line">{result}</p>
);

CommandResult.propTypes = {
  result: PropTypes.string
};

class Console extends Component {
  constructor(props) {
    super(props);
    this.state = {value: ''};
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.postCommand(this.state.value);
    this.setState({value: ''});
  }

  handleChange(event) {
    event.preventDefault();
    this.setState({value: event.target.value});
  }

  render() {
    return (
      <Grid.Row cards className="console">
        <Grid.Col>
          <Card>
            <Card.Header>
              <Card.Title>Embark console</Card.Title>
            </Card.Header>
            <Card.Body className="console--results">
              <div>
                {this.props.commands.map((command, index) => <CommandResult key={index} result={command.result} />)}
              </div>
            </Card.Body>
            <Card.Footer>
              <Form onSubmit={(event) => this.handleSubmit(event)}>
                <Form.Input value={this.state.value}
                            onChange={(event) => this.handleChange(event)}
                            name="command"
                            placeholder="Type a command (e.g help)" />
              </Form>
            </Card.Footer>
          </Card>
        </Grid.Col>
      </Grid.Row>
    );
  }
}

Console.propTypes = {
  postCommand: PropTypes.func,
  commands: PropTypes.arrayOf(PropTypes.object)
};

export default Console;
