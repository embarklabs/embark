import PropTypes from "prop-types";
import React, {Component} from 'react';
import {Grid, Card, Form, Tab, TabbedHeader, TabbedContainer} from 'tabler-react';
import Logs from "./Logs";
import Convert from 'ansi-to-html';

const convert = new Convert();

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
    const {processLogs, processes} = this.props;
    return processes.map(process => (
      <Tab title={process.name} key={process.name}>
        <Logs>
          {
            processLogs
              .filter((item) => item.name === process.name)
              .reverse()
              .map((item, i) => <p key={i} className={item.logLevel}
                                  dangerouslySetInnerHTML={{__html: convert.toHtml(item.msg)}}></p>)
          }
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
  processes: PropTypes.arrayOf(PropTypes.object).isRequired,
  processLogs: PropTypes.arrayOf(PropTypes.object).isRequired,
  updateTab: PropTypes.func
};

export default Console;