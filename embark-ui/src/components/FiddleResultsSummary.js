import React, {Component} from 'react';
import {Badge, Icon, Loader} from 'tabler-react';
import PropTypes from 'prop-types';
import FiddleDeployButton from './FiddleDeployButton';
import classNames from 'classnames';

class FiddleResultsSummary extends Component {

  _renderFatal(fatalType, title) {
    return <a className="badge-link" href={`#fatal-${fatalType}`} onClick={(e) => this.props.onFatalClick(e)}><Badge color="danger"><Icon name="slash" className="mr-1" />{title}</Badge></a>;
  }

  _renderError(errorType, numErrors) {
    const color = errorType === 'error' ? 'danger' : 'warning';
    const clickAction = errorType === 'error' ? this.props.onWarningsClick : this.props.onErrorsClick;
    return <a className="badge-link" href={`#${errorType}`} onClick={(e) => clickAction(e)}><Badge color={color}>{numErrors} {errorType}{numErrors > 1 ? "s" : ""}</Badge></a>;
  }

  render() {
    const {numWarnings, numErrors, isLoading, loadingMessage, isVisible, showDeploy, showFatalFiddle, showFatalFiddleDeploy, showFatalError} = this.props;
    const classes = classNames("compilation-summary", {
      'visible': isVisible
    });

    return (
      <div className={classes}>
        {isLoading &&
          <Loader className="mr-1">
            <span className="loader-text">{loadingMessage}</span>
          </Loader>}

        {showFatalError && this._renderFatal("error", "Error")}

        {showFatalFiddle && this._renderFatal("compile", "Compilation")}

        {showFatalFiddleDeploy && this._renderFatal("deploy", "Deployment")}

        {numErrors > 0 && this._renderError("error", numErrors)}

        {numWarnings > 0 && this._renderError("warning", numWarnings)}

        {showDeploy &&
          <React.Fragment key="success">
            <Badge className="badge-link" color="success">Compiled</Badge>
            <FiddleDeployButton onDeployClick={(e) => this.props.onDeployClick(e)} />
          </React.Fragment>
        }
      </div>
    );
  }
}

FiddleResultsSummary.propTypes = {
  isLoading: PropTypes.bool,
  loadingMessage: PropTypes.string,
  isVisible: PropTypes.bool,
  showDeploy: PropTypes.bool,
  showFatalError: PropTypes.bool,
  showFatalFiddle: PropTypes.bool,
  showFatalFiddleDeploy: PropTypes.bool,
  onDeployClick: PropTypes.func,
  numErrors: PropTypes.number,
  numWarnings: PropTypes.number,
  onWarningsClick: PropTypes.func.isRequired,
  onErrorsClick: PropTypes.func.isRequired,
  onFatalClick: PropTypes.func.isRequired
};

export default FiddleResultsSummary;
