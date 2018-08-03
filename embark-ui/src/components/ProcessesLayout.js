import PropTypes from "prop-types";
import React, {Component} from 'react';
import connect from "react-redux/es/connect/connect";
import {NavLink, Route, Switch, withRouter} from 'react-router-dom';
import {
  Page,
  Grid,
  List
} from "tabler-react";

import ProcessesContainer from '../containers/ProcessesContainer';
import Loading from "./Loading";

const routePrefix = '/embark/processes';

class ProcessesLayout extends Component {


  render() {
    if (!this.props.processes || !this.props.processes.data) {
      return <Loading />;
    }
    const processNames = Object.keys(this.props.processes.data) || [];
    return (<Grid.Row>
      <Grid.Col md={3}>
        <Page.Title className="my-5">Processes</Page.Title>
        <div>
          <List.Group transparent={true}>
            {processNames.map((processName, index) => {
              return (<List.GroupItem
                className="d-flex align-items-center capitalize"
                to={`${routePrefix}/${processName}`}
                key={'process-' + processName}
                active={index === 0 && this.props.match.isExact === true}
                RootComponent={withRouter(NavLink)}
              >
                {processName}
              </List.GroupItem>);
            })}

          </List.Group>
        </div>
      </Grid.Col>
      <Grid.Col md={9}>
        <Switch>
          <Route exact path={`${routePrefix}/`} component={ProcessesContainer} />
          {processNames.map((processName, index) => {
            return (<Route key={'procesRoute-' + index} exact path={`${routePrefix}/${processName}`} component={ProcessesContainer}/>);
          })}
        </Switch>
      </Grid.Col>
    </Grid.Row>);
  }
}

ProcessesLayout.propTypes = {
  processes: PropTypes.object,
  match: PropTypes.object
};

function mapStateToProps(state) {
  return {processes: state.processes};
}

export default connect(
  mapStateToProps
)(ProcessesLayout);

