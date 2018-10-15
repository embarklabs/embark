import PropTypes from "prop-types";
import React, {Component} from 'react';
import Convert from 'ansi-to-html';
import { Form, Col, Row, Card, CardBody, Input, CardFooter, TabContent, TabPane, Nav, NavItem, NavLink } from 'reactstrap';
import classnames from 'classnames';

import Logs from "./Logs";
import "./Console.css";
import {EMBARK_PROCESS_NAME} from '../constants';

const convert = new Convert();

class Console extends Component {
  constructor(props) {
    super(props);
    this.state = {value: '', activeTab: EMBARK_PROCESS_NAME};
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

  toggle(tab) {
    if (this.state.activeTab !== tab) {
      this.setState({
        activeTab: tab
      });
      this.props.updateTab(tab);
    }
  }

  renderNav() {
    return (
      <Nav tabs>
        {this.props.processes.map((process) => (
          <NavItem key={process.name}>
            <NavLink
              className={classnames({ active: this.state.activeTab === process.name })}
              onClick={() => { this.toggle(process.name); }}
          >
            {process.name}
          </NavLink>
        </NavItem>
        ))}
        
      </Nav>
    )
  }

  renderTabs() {
    const {processLogs, processes} = this.props;
    
    return (
      <TabContent activeTab={this.state.activeTab}>
        {processes.map(process => (
          <TabPane key={process.name} tabId={process.name}>
            <Logs>
              {processLogs
                .filter((item) => item.name === process.name)
                .reverse()
                .map((item, i) => <p key={i} className={item.logLevel}
                                    dangerouslySetInnerHTML={{__html: convert.toHtml(item.msg)}}></p>)}
            </Logs>
          </TabPane>
        ))}
      </TabContent>
    );
  }

  render() {
    const {value} = this.state;

    return (
      <Row>
        <Col>
          <Card>
            <CardBody className="console-container">
              {this.renderNav()}
              {this.renderTabs()}
            </CardBody>
            {this.props.isEmbark() && <CardFooter>
              <Form onSubmit={(event) => this.handleSubmit(event)} autoComplete="off">
                <Input value={value}
                            onChange={(event) => this.handleChange(event)}
                            name="command"
                            placeholder="Type a command (e.g help)"/>
              </Form>
            </CardFooter>}
          </Card>
        </Col>
      </Row>
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