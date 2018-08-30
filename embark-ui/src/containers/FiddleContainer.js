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
import {List, Badge, Button} from 'tabler-react';
import {NavLink} from 'react-router-dom';
import LoadingCardWithIcon from '../components/LoadingCardWithIcon';
import {hashCode} from '../utils/utils';

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
    this.warningsCardRef = null;
    this.errorsCardRef = null;
    this.fatalCardRef = null;
    this.deployedCardRef = null;
    this.fiddleResultsRef = React.createRef();
  }

  componentDidMount() {
    this.setState({loadingMessage: 'Loading saved state...'});
    this.props.fetchLastFiddle();
  }

  componentDidUpdate(prevProps) {
    const {lastFiddle} = this.props;
    if (this.state.value === '' && prevProps.lastFiddle === lastFiddle) return;
    if ((!this.state.value && lastFiddle && !lastFiddle.error) && this.state.value !== lastFiddle) {
      this._onCodeChange(lastFiddle, true);
    }
  }

  _getRowCol(errorMessage) {
    const errorSplit = errorMessage.split(':');
    if (errorSplit.length >= 3) {
      return {row: errorSplit[1], col: errorSplit[2]};
    }
    return {row: 0, col: 0};
  }

  _onCodeChange(newValue, immediate = false) {
    this.setState({readOnly: false, value: newValue});
    if (this.compileTimeout) clearTimeout(this.compileTimeout);
    this.compileTimeout = setTimeout(() => {
      this.setState({loadingMessage: 'Compiling...'});
      this.props.postFiddle(newValue, Date.now());
    }, immediate ? 0 : 1000);
  }

  _onErrorClick(e, annotation) {
    e.preventDefault();
    this.editor.gotoLine(annotation.row + 1);
    scrollToComponent(this.ace);
  }

  _onErrorSummaryClick(e, refName) {
    scrollToComponent(this[refName]);
  }

  _onDeployClick(_e) {
    this.setState({loadingMessage: 'Deploying...'});
    this.props.postFiddleDeploy(this.props.fiddle.compilationResult);
    scrollToComponent(this.deployedCardRef || this.fiddleResultsRef.current); // deployedCardRef null on first Deploy click
  }

  _renderErrors(errors, errorType) {
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
                errorMessage={error.formattedMessage} />,
            annotation: annotation
          });
        }
        return errors;
      }, []);
  }

  _renderErrorsCard(errors, errorType) {
    const color = (errorType === "error" ? "danger" : errorType);

    return (Boolean(errors.length) && <LoadingCardWithIcon
      anchorId={errorType + "s"}
      color={color}
      className={errorType + "s-card "}
      key={errorType + "s-card"}
      showCardOptions={true}
      isLoading={this.props.loading}
      cardOptionsClassName={errorType + "s"}
      body={
        <List.Group>
          {errors.map(error => { return error.node; })}
        </List.Group>
      }
      headerTitle={
        <React.Fragment>
          <span className="mr-1">{errorType + "s"}</span><Badge color={color}>{errors.length}</Badge>
        </React.Fragment>
      }
      ref={cardRef => { this[errorType + "sCardRef"] = cardRef; }}
    />);
  }

  _renderSuccessCard(title, body) {
    return this._renderLoadingCard("success", "success-card", "check", title, body, (cardRef) => {
      this.deployedCardRef = cardRef;
    });
  }

  _renderFatalCard(title, body) {
    return body && this._renderLoadingCard("danger", "fatal-card", "slash", title, body, (cardRef) => {
      this.fatalCardRef = cardRef;
    });
  }

  _renderLoadingCard(color, className, iconName, headerTitle, body, refCb) {
    return (<LoadingCardWithIcon
      color={color}
      className={className}
      iconName={iconName}
      showCardOptions={false}
      isLoading={this.props.loading}
      body={body}
      headerTitle={headerTitle}
      key={hashCode([className, iconName, headerTitle].join(''))}
      ref={refCb}
    />);
  }

  render() {
    const {fiddle, loading, fiddleError, fiddleDeployError, deployedContracts, fatalError} = this.props;
    const {loadingMessage, value, readOnly} = this.state;
    let warnings = [];
    let errors = [];
    if (fiddle && fiddle.errors) {
      warnings = this._renderErrors(fiddle.errors, "warning");
      errors = this._renderErrors(fiddle.errors, "error");
    }
    const hasResult = Boolean(fiddle);
    return (
      <React.Fragment>
        <h1 className="page-title">Fiddle</h1>
        <p>Play around with contract code and deploy against your running node.</p>
        <FiddleResultsSummary
          numErrors={errors.length}
          numWarnings={warnings.length}
          isLoading={loading}
          loadingMessage={loadingMessage}
          showFatalError={Boolean(fatalError)}
          showFatalFiddle={Boolean(fiddleError)}
          showFatalFiddleDeploy={Boolean(fiddleDeployError)}
          onDeployClick={(e) => this._onDeployClick(e)}
          isVisible={Boolean(fatalError || hasResult || loading)}
          showDeploy={hasResult && !errors.length}
          onWarningsClick={(e) => this._onErrorSummaryClick(e, "errorsCardRef")}
          onErrorsClick={(e) => this._onErrorSummaryClick(e, "warningsCardRef")}
          onFatalClick={(e) => this._onErrorSummaryClick(e, "fatalCardRef")}
        />
        <Fiddle
          value={value}
          readOnly={readOnly}
          onCodeChange={(n) => this._onCodeChange(n)}
          errors={errors}
          warnings={warnings}
          ref={(fiddle) => {
            if (fiddle) {
              this.editor = fiddle.ace.editor;
              this.ace = fiddle.ace;
            }
          }}
        />
        <FiddleResults
          key="results"
          errorsCard={this._renderErrorsCard(errors, "error")}
          warningsCard={this._renderErrorsCard(warnings, "warning")}
          fatalErrorCard={this._renderFatalCard("Fatal error", fatalError)}
          fatalFiddleCard={this._renderFatalCard("Failed to compile", fiddleError)}
          fatalFiddleDeployCard={this._renderFatalCard("Failed to deploy", fiddleDeployError)}
          deployedContractsCard={deployedContracts && this._renderSuccessCard("Contract(s) deployed!",
            <Button
              to={`/embark/contracts/${deployedContracts}/overview`}
              RootComponent={NavLink}
            >Play with my contract(s)</Button>
          )}
          forwardedRef={this.fiddleResultsRef}
        />
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
    lastFiddle: fiddle.data ? fiddle.data.codeToCompile : undefined,
    fatalError: state.errorMessage
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
  lastFiddle: PropTypes.any,
  fatalError: PropTypes.string
};

export default connect(
  mapStateToProps,
  {
    postFiddle: fiddleAction.post,
    postFiddleDeploy: fiddleDeployAction.post,
    fetchLastFiddle: fiddleFileAction.request
  },
)(FiddleContainer);
