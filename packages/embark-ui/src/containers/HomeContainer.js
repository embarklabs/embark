import PropTypes from "prop-types";
import React, {Component} from 'react';
import {connect} from 'react-redux';

import {
  Card,
  CardTitle,
  CardBody
} from 'reactstrap';

import {
  commands as commandsAction,
  commandSuggestions as commandSuggestionsAction,
  listenToProcessLogs,
  processLogs as processLogsAction,
  stopProcessLogs
} from "../actions";

import DataWrapper from "../components/DataWrapper";
import Console from '../components/Console';
import {EMBARK_PROCESS_NAME, LOG_LIMIT} from '../constants';
import PageHead from '../components/PageHead';
import ServicesContainer from './ServicesContainer';
import {getProcesses, getProcessLogs, getServices, getCommandSuggestions} from "../reducers/selectors";
import ContractsContainer from "./ContractsContainer";

class HomeContainer extends Component {
  constructor(props) {
    super(props);
    this.state = { activeProcess: EMBARK_PROCESS_NAME };
  }

  componentDidMount() {
    this.updateTab();
  }

  isEmbark() {
    return this.state.activeProcess === EMBARK_PROCESS_NAME;
  }

  updateTab(processName = EMBARK_PROCESS_NAME) {
    this.props.stopProcessLogs(this.state.activeProcess);

    this.props.fetchProcessLogs(processName, LOG_LIMIT);
    this.props.listenToProcessLogs(processName);

    this.setState({activeProcess: processName});
  }

  render() {
    return (
      <React.Fragment>
        <PageHead title="Dashboard" description="Overview of available services and logs. Interact with Embark using the console. Summary of deployed contracts." />
        <ServicesContainer />

        <DataWrapper shouldRender={this.props.processes.length > 0 } {...this.props} render={({processes, postCommand, postCommandSuggestions, processLogs, commandSuggestions}) => (
          <Card>
            <CardBody>
              <CardTitle>Console</CardTitle>
              <Console activeProcess={this.state.activeProcess}
                       postCommand={postCommand}
                       postCommandSuggestions={postCommandSuggestions}
                       processes={processes}
                       processLogs={processLogs}
                       commandSuggestions={commandSuggestions}
                       isEmbark={() => this.isEmbark}
                       updateTab={processName => this.updateTab(processName)} />
            </CardBody>
          </Card>
        )} />

        <Card>
          <CardBody>
            <CardTitle>Deployed Contracts</CardTitle>
            <div style={{marginBottom: '1.5rem', overflow: 'auto'}}>
              <ContractsContainer mode="list" numContractsToDisplay={5} updatePageHeader={false} />
            </div>
          </CardBody>
        </Card>

      </React.Fragment>
    );
  }
}

HomeContainer.propTypes = {
  processes: PropTypes.arrayOf(PropTypes.object),
  postCommand: PropTypes.func,
  postCommandSuggestions: PropTypes.func,
  error: PropTypes.string,
  loading: PropTypes.bool,
  stopProcessLogs: PropTypes.func,
  fetchProcessLogs: PropTypes.func,
  listenToProcessLogs: PropTypes.func,
  services: PropTypes.array
};

function mapStateToProps(state) {
  return {
    processes: getProcesses(state),
    services: getServices(state),
    error: state.errorMessage,
    processLogs: getProcessLogs(state),
    commandSuggestions: getCommandSuggestions(state),
    loading: state.loading
  };
}

export default connect(
  mapStateToProps,
  {
    postCommand: commandsAction.post,
    postCommandSuggestions: commandSuggestionsAction.post,
    fetchProcessLogs: processLogsAction.request,
    listenToProcessLogs,
    stopProcessLogs
  }
)(HomeContainer);
