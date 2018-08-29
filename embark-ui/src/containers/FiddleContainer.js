/* eslint multiline-ternary: "off" */
/* eslint operator-linebreak: "off" */
import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {
  fiddle as fiddleAction,
  fiddleDeploy as fiddleDeployAction,
  fiddleFile as fiddleFileAction
} from '../actions';
import Fiddle from '../components/Fiddle';
import FiddleResults from '../components/FiddleResults';
import FiddleResultsSummary from '../components/FiddleResultsSummary';
import scrollToComponent from 'react-scroll-to-component';
import {getFiddle, getFiddleDeploy} from "../reducers/selectors";
import CompilerError from "../components/CompilerError";

class FiddleContainer extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: undefined,
      loadingMessage: 'Loading...',

      readOnly: true
    };
    this.compileTimeout = null;
    this.ace = null;
    this.editor = null;
  }

  componentDidMount() {
    this.setState({loadingMessage: 'Loading saved state...'});
    this.props.fetchLastFiddle();
  }

  componentDidUpdate(prevProps) {
    const {lastFiddle} = this.props;
    if(this.state.value === '' && prevProps.lastFiddle === lastFiddle) return;
    if((!this.state.value && lastFiddle && !lastFiddle.error) && this.state.value !== lastFiddle) {
      this._onCodeChange(lastFiddle, true);
    }
  }

  _onCodeChange(newValue, immediate = false) {
    this.setState({readOnly: false, value: newValue});
    if (this.compileTimeout) clearTimeout(this.compileTimeout);
    this.compileTimeout = setTimeout(() => {
      this.setState({loadingMessage: 'Compiling...'});
      this.props.postFiddle(newValue, Date.now());
    }, immediate ? 0 : 1000);

  }

  _getFormattedErrors(errors, errorType){
    return errors.reduce(
      (errors, error, index) => {
        if (error.severity === errorType) {
          const errorRowCol = this._getRowCol(error.formattedMessage);
          const annotation = Object.assign({}, {
            row: errorRowCol.row - 1, // must be 0 based
            column: errorRowCol.col - 1,  // must be 0 based
            text: error.formattedMessage,  // text to show in tooltip
            type: error.severity // "error"|"warning"|"info"
          });
          errors.push({
            solcError: error,
            node:
            <CompilerError
              onClick={(e) => { this._onErrorClick(e, annotation); }}
              key={`${errorType}_${index}`}
              index={index}
              errorType={errorType}
              row={errorRowCol.row}
              errorMessage={error.formattedMessage}/>,
            annotation: annotation
          });
        }
        return errors;
      }, []);
  }

  _getRowCol(errorMessage){
    const errorSplit = errorMessage.split(':');
    if(errorSplit.length >= 3){
      return {row: errorSplit[1], col: errorSplit[2]};
    }
    return {row: 0, col: 0};
  }

  _onErrorClick(e, annotation){
    e.preventDefault();
    this.editor.gotoLine(annotation.row + 1);
    scrollToComponent(this.ace);
  }

  _onDeployClick(_e){
    this.setState({loadingMessage: 'Deploying...'});
    this.props.postFiddleDeploy(this.props.fiddle.compilationResult);
  }

  render() {
    const {fiddle, loading, fiddleError, fiddleDeployError, deployedContracts} = this.props;
    const {loadingMessage, value, readOnly} = this.state;
    let renderings = [];
    let warnings = [];
    let errors = [];
    if (fiddle && fiddle.errors) {
      warnings = this._getFormattedErrors(fiddle.errors, "warning");
      errors = this._getFormattedErrors(fiddle.errors, "error");
    }
    renderings.push(
      <React.Fragment key="fiddle">
        <FiddleResultsSummary
          errors={errors}
          warnings={warnings}
          isLoading={loading}
          loadingMessage={loadingMessage}
          hasResult={Boolean(fiddle)}
          fatalFiddle={fiddleError}
          fatalFiddleDeploy={fiddleDeployError}
          onDeployClick={(e) => this._onDeployClick(e)}
        />
        <Fiddle
          value={value}
          readOnly={readOnly}
          onCodeChange={(n) => this._onCodeChange(n)}
          errors={errors}
          warnings={warnings}
          ref={(fiddle) => {
            if(fiddle) {
              this.editor = fiddle.ace.editor;
              this.ace = fiddle.ace;
            }
          }}
        />
      </React.Fragment>
    );
    if (fiddle || (this.state.value && (fiddleError || fiddleDeployError))) {
      renderings.push(
        <FiddleResults
          key="results"
          errors={errors}
          warnings={warnings}
          fatalFiddle={fiddleError}
          fatalFiddleDeploy={fiddleDeployError}
          isLoading={loading}
          deployedContracts={deployedContracts}
        />);
    }

    return (
      <React.Fragment>
        <h1 className="page-title">Fiddle</h1>
        <p>Play around with contract code and deploy against your running node.</p>
        {renderings}
      </React.Fragment>
    );
  }
}
function mapStateToProps(state) {
  const fiddle = getFiddle(state);
  const deployedFiddle = getFiddleDeploy(state);
  return {
    fiddle: fiddle.data,
    deployedContracts: deployedFiddle.data,
    fiddleError: fiddle.error,
    fiddleDeployError: deployedFiddle.error,
    loading: state.loading,
    lastFiddle: fiddle.data ? fiddle.data.codeToCompile : undefined
  };
}

FiddleContainer.propTypes = {
  fiddle: PropTypes.object,
  fiddleError: PropTypes.string,
  fiddleDeployError: PropTypes.string,
  loading: PropTypes.bool,
  postFiddle: PropTypes.func,
  postFiddleDeploy: PropTypes.func,
  deployedContracts: PropTypes.string,
  fetchLastFiddle: PropTypes.func,
  lastFiddle: PropTypes.any
};

export default connect(
  mapStateToProps,
  {
    postFiddle: fiddleAction.post,
    postFiddleDeploy: fiddleDeployAction.post,
    fetchLastFiddle: fiddleFileAction.request
  },
)(FiddleContainer);
