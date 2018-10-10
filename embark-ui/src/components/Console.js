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

  getProcessLogs(processName){
    const log = this.props.processLogs
      .reverse()
      .filter(item => item.process === processName);

    if(!log.length) return [];
    // the selector should have reduced `processLogs` down to one
    // record per process, and therefore after filtering, the array
    // should have only one item
    return log[0].logs;
  }

  renderCommandsResult(){
    const {commands} = this.props;
    return (
      this.props.isEmbark() && 
      commands.map((command, index) => {
        return <CommandResult key={index} result={command.result}/>;
      })
    );
  }

  renderTabs() {
    const {processes} = this.props;
    return processes
      .sort((a, b) => { // ensure the "Embark" tab is displayed first
        if (a.name === 'embark') return -1;
        if (b.name === 'embark') return 1;
        return 0;
      })
      .map(process => (
        <Tab title={process.name} key={process.name} onClick={(e, x) => this.clickTab(e, x)}>
          <Logs>
            {
              this.getProcessLogs(process.name)
                .map((item, i) => <p key={i} className={item.logLevel}
                                    dangerouslySetInnerHTML={{__html: convert.toHtml(item.msg)}}></p>)
            }
          </Logs>
        </Tab>
    ));
  }

  render() {
    const tabs = this.renderTabs();
    const commandsResult = this.renderCommandsResult();
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
                  {commandsResult}
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
