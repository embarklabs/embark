import PropTypes from "prop-types";
import React, {Component} from 'react';
import connect from "react-redux/es/connect/connect";
import {NavLink, Route, Switch, withRouter, Redirect} from 'react-router-dom';
import {
  Page,
  Grid,
  List
} from "tabler-react";

import ProcessContainer from '../containers/ProcessContainer';
import {getProcesses} from "../reducers/selectors";
import Loading from "./Loading";

const routePrefix = '/embark/processes';

class ProcessesLayout extends Component {
  render() {
    if (this.props.processes.length === 0) {
      return <Loading />;
    }
    return (<Grid.Row>
      <Grid.Col md={3}>
        <Page.Title className="my-5">Processes</Page.Title>
        <div>
          <List.Group transparent={true}>
            {this.props.processes.map((process, index) => {
              return (<List.GroupItem
                className="d-flex align-items-center text-capitalize"
                to={`${routePrefix}/${process.name}`}
                key={'process-' + process.name}
                active={index === 0 && this.props.match.isExact === true}
                RootComponent={withRouter(NavLink)}
              >
                {process.name}
              </List.GroupItem>);
            })}

          </List.Group>
        </div>
      </Grid.Col>
      <Grid.Col md={9}>
        <Switch>
          <Route exact path={`${routePrefix}/:processName`} component={() => <ProcessContainer />} />
          <Redirect exact from={`${routePrefix}/`} to={`${routePrefix}/${this.props.processes[0].name}`} />
        </Switch>
      </Grid.Col>
    </Grid.Row>);
  }
}

ProcessesLayout.propTypes = {
  processes: PropTypes.arrayOf(PropTypes.object),
  match: PropTypes.object
};

function mapStateToProps(state) {
  return {processes: getProcesses(state)};
}

export default connect(
  mapStateToProps
)(ProcessesLayout);

