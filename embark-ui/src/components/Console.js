import PropTypes from "prop-types";
import React, {Component} from 'react';
import {Grid, Card, Form, Tab, TabbedHeader, TabbedContainer} from 'tabler-react';
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

  renderTabs() {
    const {processLogs, processes, commands} = this.props;
    return processes.map(process => (
      <Tab title={process.name} key={process.name} onClick={(e, x) => this.clickTab(e, x)}>
        <Logs>
          {
            processLogs.reverse().filter((item) => item.name === process.name)
              .map((item, i) => <p key={i} className={item.logLevel}
                                   dangerouslySetInnerHTML={{__html: convert.toHtml(item.msg)}}></p>)
          }
          {process.name === "embark" && commands.map((command, index) => <CommandResult key={index} result={command.result}/>)}
        </Logs>
      </Tab>
    ));
  }

  render() {
    const tabs = this.renderTabs();
    const {value} = this.state;

    return (
      <Grid.Row cards className="console">
        <Grid.Col>
          <Card>
            <Card.Body className="console-container">
              <React.Fragment>
                <TabbedHeader
                  selectedTitle={this.props.activeProcess}
                  stateCallback={this.props.updateTab}
                >
                  {tabs}
                </TabbedHeader>
                <TabbedContainer selectedTitle={this.props.activeProcess}>
                  {tabs}
                </TabbedContainer>
              </React.Fragment>
            </Card.Body>
            {this.props.isEmbark() && <Card.Footer>
              <form onSubmit={(event) => this.handleSubmit(event)} autoComplete="off">
                <Form.Input value={value}
                            onChange={(event) => this.handleChange(event)}
                            name="command"
                            placeholder="Type a command (e.g help)"/>
              </form>
            </Card.Footer>}
          </Card>
        </Grid.Col>
      </Grid.Row>
    );
  }
}

Console.propTypes = {
  postCommand: PropTypes.func,
  isEmbark: PropTypes.func,
  commands: PropTypes.arrayOf(PropTypes.object).isRequired,
  processes: PropTypes.arrayOf(PropTypes.object).isRequired,
  processLogs: PropTypes.arrayOf(PropTypes.object).isRequired,
  updateTab: PropTypes.func
};

export default Console;
