import PropTypes from "prop-types";
import React from 'react';
import { TabContent, TabPane, Nav, NavItem, NavLink } from 'reactstrap';
import classnames from 'classnames';

import ContractOverview from '../components/ContractOverview';
import ContractLoggerContainer from '../containers/ContractLoggerContainer';
import ContractFunctionsContainer from '../containers/ContractFunctionsContainer';

class ContractLayout extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      activeTab: '1'
    };
  }

  toggle(tab) {
    if (this.state.activeTab !== tab) {
      this.setState({
        activeTab: tab
      });
    }
  }

  render() {
    return (
      <React.Fragment>
        <Nav tabs>
          <NavItem>
            <NavLink
              className={classnames({ active: this.state.activeTab === '1' })}
              onClick={() => { this.toggle('1'); }}
            >
              Overview
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              className={classnames({ active: this.state.activeTab === '2' })}
              onClick={() => { this.toggle('2'); }}
            >
              Functions
            </NavLink>
          </NavItem>
          <NavItem>
            <NavLink
              className={classnames({ active: this.state.activeTab === '3' })}
              onClick={() => { this.toggle('3'); }}
            >
              Logger
            </NavLink>
          </NavItem>
        </Nav>
        <TabContent activeTab={this.state.activeTab}>
          <TabPane tabId="1">
            <ContractOverview contract={this.props.contract} />
          </TabPane>
          <TabPane tabId="2">
            <ContractFunctionsContainer contract={this.props.contract} />
          </TabPane>
          <TabPane tabId="3">
            <ContractLoggerContainer contract={this.props.contract} />
          </TabPane>
        </TabContent>
      </React.Fragment>
    )
  }
}

ContractLayout.propTypes = {
  contract: PropTypes.object
};

export default ContractLayout;
