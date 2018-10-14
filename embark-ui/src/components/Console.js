import PropTypes from "prop-types";
import React, {Component} from 'react';
import Convert from 'ansi-to-html';

import { Form, Col, Row, Card, CardBody, Input, CardFooter, TabContent, TabPane, Nav, NavItem, NavLink } from 'reactstrap';
import classnames from 'classnames';
import {AsyncTypeahead} from 'react-bootstrap-typeahead'

import Logs from "./Logs";
import "./Console.css";
import {EMBARK_PROCESS_NAME} from '../constants';

const convert = new Convert();

class Console extends Component {
  constructor(props) {
    super(props);
    this.state = {value: '', isLoading: true, options: [], activeTab: EMBARK_PROCESS_NAME};
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.postCommand(this.state.value);
    this.setState({value: ''});
    this.typeahead.getInstance().clear()
  }

  handleChange(value, cb) {
    this.setState({value: value}, cb);
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
            <Card.Body className="console-container">
              {this.renderNav()}
              {this.renderTabs()}
            </Card.Body>
            {this.props.isEmbark() && <Card.Footer>
              <AsyncTypeahead
								autoFocus={true}
                emptyLabel={false}
                labelKey="value"
                multiple={false}
                emptyLabel={false}
                maxResults={10}
                isLoading={this.state.isLoading}
                onInputChange={(text) => this.handleChange(text)}
                onChange={(text) => {
                  if (text && text[0]) {
                    this.handleChange(text[0].value)
                  }
                }}
                ref={(typeahead) => this.typeahead = typeahead}
                searchText={false}
                onKeyDown={(e) => {
                  if (e.keyCode === 13) {
                    this.handleChange(e.target.value, () => {
                      this.handleSubmit(e)
                    })
                  }
                }}
                onSearch={(value) => {
									this.props.postCommandSuggestions(value)
                }}
                filterBy={['value', 'description']}
                maxHeight="200px"
                placeholder="Type a command (e.g help)"
                options={this.props.command_suggestions}
                placeholder="Choose a state..."
                renderMenuItemChildren={(option) => (
                  <div>
                    {option.value}
                    <div>
                      <small>{option.command_type} - {option.description}</small>
                    </div>
                  </div>
                )}
              />
            </Card.Footer>}
          </Card>
        </Col>
      </Row>
    );
  }
}

Console.propTypes = {
  postCommand: PropTypes.func,
  postCommandSuggestions: PropTypes.func,
  isEmbark: PropTypes.func,
  processes: PropTypes.arrayOf(PropTypes.object).isRequired,
  command_suggestions: PropTypes.arrayOf(PropTypes.object),
  processLogs: PropTypes.arrayOf(PropTypes.object).isRequired,
  updateTab: PropTypes.func
};

export default Console;
