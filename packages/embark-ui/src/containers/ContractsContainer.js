import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {contracts as contractsAction,
        listenToContracts,
        stopContracts} from "../actions";
import Contracts from '../components/Contracts';
import ContractsList from '../components/ContractsList';
import {getContracts} from "../reducers/selectors";
import PageHead from "../components/PageHead";
import Loading from '../components/Loading';
import Error from '../components/Error';

const MAX_CONTRACTS = 10;

class ContractsContainer extends Component {
  constructor(props) {
    super(props);

    this.numContractsToDisplay = this.props.numContractsToDisplay || MAX_CONTRACTS;
    this.state = {currentPage: 1};
  }

  componentDidMount() {
    this.props.fetchContracts();
    this.props.listenToContracts();
  }

  componentWillUnmount() {
    this.props.stopContracts();
  }

  get numberOfContracts() {
    if (this._numberOfContracts === undefined) {
      this._numberOfContracts = this.props.contracts
        .filter(contract => !contract.silent)
        .length;
    }
    return this._numberOfContracts;
  }

  get numberOfPages() {
    if (this._numberOfPages === undefined) {
      this._numberOfPages = Math.ceil(
        this.numberOfContracts / this.numContractsToDisplay
      );
    }
    return this._numberOfPages;
  }

  resetNums() {
    this._numberOfContracts = undefined;
    this._numberOfPages = undefined;
  }

  changePage(newPage) {
    if (newPage <= 0) {
      newPage = 1;
    } else if (newPage > this.numberOfPages) {
      newPage = this.numberOfPages;
    }
    this.setState({ currentPage: newPage });
    this.props.fetchContracts();
  }

  get currentContracts() {
    let offset = 0;
    return this.props.contracts
      .filter((contract, arrIndex) => {
        if (contract.silent) {
          offset++;
          return false
        };
        const index = (
          (arrIndex + 1 - offset) -
          (this.numContractsToDisplay * (this.state.currentPage - 1))
        );
        return index <= this.numContractsToDisplay && index > 0;
      })
      .sort((a, b) => {
        return (a.className < b.className) ? -1 : 1;
      });
  }

  render() {
    const {error, loading, mode, updatePageHeader} = this.props;
    if (error) {
      return <Error error={error} />;
    }

    if (loading) {
      return <Loading />;
    }

    this.resetNums();
    let ContractsComp;
    if (mode === "detail") {
      ContractsComp = Contracts
    } else if (mode === "list") {
      ContractsComp = ContractsList
    }
    return (
      <React.Fragment>
        {updatePageHeader &&
          <PageHead title="Contracts"
            description="Summary of all deployed contracts" />}
        <ContractsComp contracts={this.currentContracts}
                       numberOfPages={this.numberOfPages}
                       changePage={(newPage) => this.changePage(newPage)}
                       currentPage={this.state.currentPage} />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {
    contracts: getContracts(state),
    error: state.errorMessage,
    loading: state.loading
  };
}

ContractsContainer.propTypes = {
  contracts: PropTypes.array,
  fetchContracts: PropTypes.func,
  numContractsToDisplay: PropTypes.number,
  listenToContracts: PropTypes.func,
  stopContracts: PropTypes.func,
  fiddleContracts: PropTypes.array,
  mode: PropTypes.string,
  updatePageHeader: PropTypes.bool,
  error: PropTypes.string,
  loading: PropTypes.bool
};

ContractsContainer.defaultProps = {
  mode: "detail",
  updatePageHeader: true
}

export default connect(
  mapStateToProps, {
    fetchContracts: contractsAction.request,
    listenToContracts,
    stopContracts,
  }
)(ContractsContainer);
