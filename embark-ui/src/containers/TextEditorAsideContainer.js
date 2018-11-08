import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {Card, CardBody} from 'reactstrap';

import Preview from '../components/Preview';
import {contracts as contractsAction} from '../actions';
import {getContractsByPath} from "../reducers/selectors";
import ContractDetail from '../components/ContractDetail';
import ContractTransactionsContainer from './ContractTransactionsContainer';
import ContractOverviewContainer from '../containers/ContractOverviewContainer';
import ContractDebuggerContainer from '../containers/ContractDebuggerContainer';
import { TextEditorToolbarTabs } from '../components/TextEditorToolbar';

class TextEditorAsideContainer extends Component {
  componentDidMount() {
    this.props.fetchContracts();
  }

  renderContent(contract, index) {
    switch (this.props.currentAsideTab.label) {
      case TextEditorToolbarTabs.Debugger.label:
        return (
          <React.Fragment>
            <h2>{contract.className} - Debugger</h2>
            <ContractDebuggerContainer key={index} contract={contract}/>
          </React.Fragment>
        );
      case TextEditorToolbarTabs.Details.label:
        return (
          <React.Fragment>
            <h2>{contract.className} - Details</h2>
            <ContractDetail key={index} contract={contract}/>
          </React.Fragment>
        );
      case TextEditorToolbarTabs.Transactions.label:
        return (
          <React.Fragment>
            <h2>{contract.className} - Transactions</h2>
            <ContractTransactionsContainer key={index} contract={contract}/>
          </React.Fragment>
        );
      case TextEditorToolbarTabs.Interact.label:
        return (
          <React.Fragment>
            <h2>{contract.className} - Interact</h2>
            <ContractOverviewContainer key={index} contract={contract}/>
          </React.Fragment>
        );
      default:
        return '';
    }
  }

  render() {
    if (this.props.currentAsideTab.label === TextEditorToolbarTabs.Browser.label) {
      return <Preview/>;
    }
    return this.props.contracts.map((contract, index) => {
      return (
        <Card key={'contract-' + index} className="editor-aside-card rounded-0 border-top-0">
          <CardBody>
            {this.renderContent(contract, index)}
          </CardBody>
        </Card>
      );
    });
  }
}

function mapStateToProps(state, props) {
  return {
    contracts: getContractsByPath(state, props.currentFile.path)
  };
}

TextEditorAsideContainer.propTypes = {
  currentFile: PropTypes.object,
  currentAsideTab: PropTypes.object,
  contract: PropTypes.array,
  fetchContracts: PropTypes.func,
  contracts: PropTypes.array
};

export default connect(
  mapStateToProps,
  {
    fetchContracts: contractsAction.request
  }
)(TextEditorAsideContainer);
