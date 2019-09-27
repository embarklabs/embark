import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {Card, CardBody} from 'reactstrap';
import classNames from 'classnames';

import Preview from '../components/Preview';
import {getContractsByPath, getPreviewUrl} from "../reducers/selectors";
import ContractDetail from '../components/ContractDetail';
import ContractLogContainer from './ContractLogContainer';
import ContractOverviewContainer from '../containers/ContractOverviewContainer';
import ContractDebuggerContainer from '../containers/ContractDebuggerContainer';
import { TextEditorToolbarTabs } from '../components/TextEditorToolbar';
import {
  updatePreviewUrl as updatePreviewUrlAction
} from '../actions';

class TextEditorAsideContainer extends Component {
  renderContent(contract, index) {
    switch (this.props.currentAsideTab.label) {
      case TextEditorToolbarTabs.Details.label:
        return (
          <React.Fragment>
            <h2>{contract.className} - Details</h2>
            <ContractDetail key={index} contract={contract}/>
          </React.Fragment>
        );
      case TextEditorToolbarTabs.Log.label:
        return (
          <React.Fragment>
            <h2>{contract.className} - Log</h2>
            <ContractLogContainer key={index} contract={contract}/>
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
    return (
      <React.Fragment>
        <div className={classNames('h-100', {'d-none': this.props.currentAsideTab.label !== TextEditorToolbarTabs.Browser.label})}>
          <Preview previewUrl={this.props.previewUrl} updatePreviewUrl={this.props.updatePreviewUrl}/>
        </div>
        {this.props.currentAsideTab.label === TextEditorToolbarTabs.Debugger.label &&
          <React.Fragment>
            <h2>Debugger</h2>
            <ContractDebuggerContainer debuggerTransactionHash={this.props.debuggerTransactionHash}/>
          </React.Fragment>
        }
        {this.props.contracts.map((contract, index) => (
          <Card key={'contract-' + index} className="editor-aside-card rounded-0 border-top-0">
            <CardBody>
              {this.renderContent(contract, index)}
            </CardBody>
          </Card>
        ))}
      </React.Fragment>
    );
  }
}

function mapStateToProps(state, props) {
  return {
    contracts: getContractsByPath(state, props.currentFile.path),
    previewUrl: getPreviewUrl(state)
  };
}

TextEditorAsideContainer.propTypes = {
  currentFile: PropTypes.object,
  debuggerTransactionHash: PropTypes.string,
  currentAsideTab: PropTypes.object,
  contracts: PropTypes.array,
  updatePreviewUrl: PropTypes.func,
  previewUrl: PropTypes.string
};

export default connect(
  mapStateToProps,
  {
    updatePreviewUrl: updatePreviewUrlAction
  }
)(TextEditorAsideContainer);
