import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {Card, CardBody} from 'reactstrap';

import Preview from '../components/Preview';
import {contracts as contractsAction} from '../actions';
import {getContractsByPath} from "../reducers/selectors";
import ContractDetail from '../components/ContractDetail';
import ContractLoggerContainer from '../containers/ContractLoggerContainer';
import ContractOverviewContainer from '../containers/ContractOverviewContainer';
import ContractDebuggerContainer from '../containers/ContractDebuggerContainer';

class TextEditorAsideContainer extends Component {
  componentDidMount() {
    this.props.fetchContracts();
  }

  render() {
    switch(this.props.currentAsideTab) {
      case 'browser':
        return <Preview />;
      case 'debugger':
        return this.props.contracts.map((contract, index) => {
          return (
            <Card key={'contract-' + index}>
              <CardBody>
                <h2>{contract.className} - Details</h2>
                <ContractDebuggerContainer key={index} contract={contract} />
              </CardBody>
            </Card>
          );
        });
      case 'detail':
        return this.props.contracts.map((contract, index) => {
          return (
            <Card key={'contract-' + index}>
              <CardBody>
                <h2>{contract.className} - Details</h2>
                <ContractDetail key={index} contract={contract} />
              </CardBody>
            </Card>
          );
        });
      case 'logger':
        return this.props.contracts.map((contract, index) => {
          return (
            <Card key={'contract-' + index}>
              <CardBody>
                <h2>{contract.className} - Transactions</h2>
                <ContractLoggerContainer key={index} contract={contract} />)
              </CardBody>
            </Card>
          );
        });
      case 'overview':
        return this.props.contracts.map((contract, index) => {
          return (
            <Card key={'contract-' + index}>
              <CardBody>
                <h2>{contract.className} - Overview</h2>
                <ContractOverviewContainer key={index} contract={contract} />
              </CardBody>
            </Card>
          );
        });
      default:
        return <React.Fragment></React.Fragment>;
    }
  }
}

function mapStateToProps(state, props) {
  return {
    contracts: getContractsByPath(state, props.currentFile.path)
  };
}

TextEditorAsideContainer.propTypes = {
  currentFile: PropTypes.object,
  currentAsideTab: PropTypes.string,
  contract: PropTypes.array,
  fetchContracts: PropTypes.func,
  contracts: PropTypes.array
};

export default connect(
  mapStateToProps,
  {
    fetchContracts: contractsAction.request
  },
)(TextEditorAsideContainer);
