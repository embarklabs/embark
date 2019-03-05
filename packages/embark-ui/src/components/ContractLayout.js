import PropTypes from "prop-types";
import React from 'react';
import FontAwesomeIcon from "react-fontawesome";
import { TabContent, TabPane, Nav, NavItem, NavLink, Card, CardBody, CardTitle } from 'reactstrap';
import classnames from 'classnames';

import ContractDetail from '../components/ContractDetail';
import ContractLogContainer from '../containers/ContractLogContainer';
import ContractOverviewContainer from '../containers/ContractOverviewContainer';

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
        <Card>
          <CardBody>
            <CardTitle>{this.props.contract.className}</CardTitle>
            <Nav tabs>
              <NavItem>
                <NavLink
                  className={classnames({ active: this.state.activeTab === '1' })}
                  onClick={() => { this.toggle('1'); }}
                >
                  <FontAwesomeIcon className="mr-2" name="bolt" />Interact
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={classnames({ active: this.state.activeTab === '2' })}
                  onClick={() => { this.toggle('2'); }}
                >
                  <FontAwesomeIcon className="mr-2" name="info-circle" />Details
                </NavLink>
              </NavItem>
              <NavItem>
                <NavLink
                  className={classnames({ active: this.state.activeTab === '3' })}
                  onClick={() => { this.toggle('3'); }}
                >
                  <FontAwesomeIcon className="mr-2" name="list-alt" />Log
                </NavLink>
              </NavItem>
            </Nav>
            <TabContent activeTab={this.state.activeTab}>
              <TabPane tabId="1">
                <ContractOverviewContainer contract={this.props.contract} />
              </TabPane>
              <TabPane tabId="2">
                <ContractDetail contract={this.props.contract} />
              </TabPane>
              <TabPane tabId="3">
                <ContractLogContainer contract={this.props.contract} />
              </TabPane>
            </TabContent>
          </CardBody>
        </Card>
      </React.Fragment>
    );
  }
}

ContractLayout.propTypes = {
  contract: PropTypes.object
};

export default ContractLayout;
