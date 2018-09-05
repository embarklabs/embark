import PropTypes from "prop-types";
import React, {Component} from 'react';
import {Grid, Card, Form, Tabs, Tab} from 'tabler-react';
import Logs from "./Logs";
import Convert from 'ansi-to-html';

const convert = new Convert();

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
    const {processLogs, processes, commands}= this.props;
    return (
      <Grid.Row cards className="console">
        <Grid.Col>
          <Card>
            <Card.Header>
              <Card.Title>Embark console</Card.Title>
            </Card.Header>
            <Card.Body >
              <Tabs initialTab="Embark">
                <Tab title="Embark">
                  <Logs>
                    {commands.map((command, index) => <CommandResult key={index} result={command.result}/>)}
                  </Logs>
                </Tab>
                {processes.map(process => {
                  return (
                    <Tab title={process.name} key={process.name}>
                      <Logs>
                        {
                          processLogs.filter((item) => item.name === process.name)
                            .map((item, i) => <p key={i} className={item.logLevel}
                                                          dangerouslySetInnerHTML={{__html: convert.toHtml(item.msg)}}></p>)
                        }
                      </Logs>
                    </Tab>
                  );
                })}
              </Tabs>

            </Card.Body>
            <Card.Footer>
              <form onSubmit={(event) => this.handleSubmit(event)} autoComplete="off">
                <Form.Input value={this.state.value}
                            onChange={(event) => this.handleChange(event)}
                            name="command"
                            placeholder="Type a command (e.g help)" />
              </form>
            </Card.Footer>
          </Card>
        </Grid.Col>
      </Grid.Row>
    );
  }
}

Console.propTypes = {
  postCommand: PropTypes.func,
  commands: PropTypes.arrayOf(PropTypes.object).isRequired,
  processes: PropTypes.arrayOf(PropTypes.object).isRequired,
  processLogs: PropTypes.arrayOf(PropTypes.object).isRequired
};

export default Console;
