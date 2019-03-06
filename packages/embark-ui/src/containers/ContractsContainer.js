import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {
  listenToContracts as listenToContractsAction,
  stopContracts as stopContractsAction,
  contracts as contractsAction
} from "../actions";

import Contracts from '../components/Contracts';
import ContractsList from '../components/ContractsList';
import DataWrapper from "../components/DataWrapper";
import PageHead from "../components/PageHead";
import {getContracts} from "../reducers/selectors";

class ContractsContainer extends Component {
  componentDidMount() {
    this.props.fetchContracts();
    this.props.listenToContracts();
  }

  componentWillUnmount() {
    this.props.stopContracts();
  }

  render() {
    return (
      <React.Fragment>
        {this.props.updatePageHeader && <PageHead title="Contracts" description="Summary of all deployed contracts" />}
        <DataWrapper shouldRender={this.props.contracts.length > 0} {...this.props} render={({contracts}) => {
            if (this.props.mode === "list") return <ContractsList contracts={contracts} />;
            if (this.props.mode === "detail") return <Contracts contracts={contracts} />; 
        }} />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {
    contracts: getContracts(state), 
    error: state.errorMessage, 
    loading: state.loading};
}

ContractsContainer.propTypes = {
  listenToContracts: PropTypes.func,
  stopContracts: PropTypes.func,
  contracts: PropTypes.array,
  fiddleContracts: PropTypes.array,
  fetchContracts: PropTypes.func,
  mode: PropTypes.string,
  updatePageHeader: PropTypes.bool
};

ContractsContainer.defaultProps = {
  mode: "detail",
  updatePageHeader: true
}

export default connect(
  mapStateToProps,{
    listenToContracts: listenToContractsAction,
    stopContracts: stopContractsAction,
    fetchContracts: contractsAction.request
  }
)(ContractsContainer);
