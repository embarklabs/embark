import PropTypes from "prop-types";
import React, {Component} from 'react';
import {Grid, Card, Form} from 'tabler-react';

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
    this.setState({value: event.target.value});
  }

  render() {
    return (
      <Grid.Row cards>
        <Grid.Col>
          <Card>
            <Card.Header>
              <Card.Title>Embark console</Card.Title>
            </Card.Header>
            <Card.Body>
              <div>
                {this.props.commandResults &&
                  this.props.commandResults.map((result) => <CommandResult key={result} result={result} />)}
              </div>
              <Form onSubmit={(event) => this.handleSubmit(event)}>
                <Form.Input value={this.state.value}
                            onChange={(event) => this.handleChange(event)}
                            name="command"
                            placeholder="Type a command (e.g help)" />
              </Form>
            </Card.Body>
          </Card>
        </Grid.Col>
      </Grid.Row>
    );
  }
}

Console.propTypes = {
  postCommand: PropTypes.func,
  commandResults: PropTypes.arrayOf(PropTypes.string)
};

export default Console;
