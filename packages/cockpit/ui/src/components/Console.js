import PropTypes from "prop-types";
import React, {Component} from 'react';
import Convert from 'ansi-to-html';

import { Col, Row,  TabContent, TabPane, Nav, NavItem, NavLink } from 'reactstrap';
import classnames from 'classnames';
import {AsyncTypeahead} from 'react-bootstrap-typeahead';
import ReactJson from 'react-json-view';

import Logs from "./Logs";
import "./Console.css";
import {EMBARK_PROCESS_NAME} from '../constants';

const convert = new Convert({newline: true, escapeXML: true});

class Console extends Component {
  constructor(props) {
    super(props);
    // Add embark to the start of the list
    this.processes = [...props.processes];
    this.processes.unshift({name: 'embark', state: 'running'});

    this.state = {value: '', isLoading: true, options: [], activeTab: EMBARK_PROCESS_NAME};
  }

  handleSubmit(event) {
    const instance = this.typeahead.getInstance();
    const activeItem = instance.state.activeItem || {};
    if(activeItem.paginationOption) {
      return;
    }

    event.preventDefault();
    this.props.postCommand(this.state.value);
    this.setState({value: ''});
    instance.clear();
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
        {this.processes.map((process) => (
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
    );
  }

  isJsonObject(msg) {
    try {
      return typeof (JSON.parse(msg)) === 'object';
    } catch(_err) {
      return false;
    }
  }

  logClassName(item) {
    return classnames('m-0', {
      'console-text': true,
      'text-success': item.logLevel === 'info',
      'text-info': item.logLevel === 'debug',
      'text-danger': item.logLevel === 'error',
      'text-warning': item.logLevel === 'warning'
    });
  }

  renderTabs() {
    const {processLogs} = this.props;

    return (
      <TabContent activeTab={this.state.activeTab}>
        {this.processes.map(process => (
          <TabPane key={process.name} tabId={process.name}>
            <Logs>
              {processLogs
                .filter((item) => item.name === process.name)
                .reverse()
                .map((item, i) => {
                  const msg = item.result || item.msg;

                  if (this.isJsonObject(msg)) {
                    return(
                      <div key={`message-${i}`}>
                        <p className={this.logClassName(item)} dangerouslySetInnerHTML={{__html: (convert.toHtml(item.command || ""))}}/>
                        <ReactJson src={JSON.parse(msg)} theme="monokai" sortKeys={true} collapsed={1} />
                      </div>
                    );
                  }
                  return (
                    <p key={i} className={this.logClassName(item)} dangerouslySetInnerHTML={{__html: (convert.toHtml(item.command || "") + convert.toHtml(msg))}}/>
                  );
                })
              }
            </Logs>
            {process.name === "embark" &&
              <AsyncTypeahead
                id="console-typeahead"
                autoFocus={true}
                emptyLabel={false}
                labelKey="value"
                multiple={false}
                maxResults={20}
                isLoading={this.state.isLoading}
                onInputChange={(text) => this.handleChange(text)}
                onChange={(text) => {
                  if (text && text[0]) {
                    this.handleChange(text[0].value);
                  }
                }}
                ref={(typeahead) => this.typeahead = typeahead}
                searchText={false}
                onKeyDown={(e) => {
                  if (e.keyCode === 13) {
                    this.handleChange(e.target.value, () => {
                      this.handleSubmit(e);
                    });
                  }
                }}
                onSearch={(value) => {
                  this.props.postCommandSuggestions(value);
                }}
                filterBy={['value', 'description']}
                maxHeight="200px"
                placeholder="Type a command (e.g help)"
                options={this.props.commandSuggestions}
                renderMenuItemChildren={(option) => (
                  <div>
                    {option.value}
                    <div>
                      <small>{option.command_type} - {option.description}</small>
                    </div>
                  </div>
                )}
              />
            }

          </TabPane>
        ))}
      </TabContent>
    );
  }

  render() {
    return (
      <Row>
        <Col>
          {this.renderNav()}
          {this.renderTabs()}
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
  commandSuggestions: PropTypes.arrayOf(PropTypes.object),
  processLogs: PropTypes.arrayOf(PropTypes.object).isRequired,
  updateTab: PropTypes.func
};

export default Console;
