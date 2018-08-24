import React, {Component} from 'react';
import {Badge, Icon} from 'tabler-react';
import PropTypes from 'prop-types';
import FiddleDeployButton from './FiddleDeployButton';

class FiddleResultsSummary extends Component{

  render(){
    const {warnings, errors, isLoading, loadingMessage, hasResult, fatalFiddle, fatalFiddleDeploy} = this.props;
    let renderings = [];
    if(isLoading){
      renderings.push(
        <React.Fragment key="loading"><div className="loader"></div><span className="loader-text">{loadingMessage}</span></React.Fragment>
      );
    }
    if(fatalFiddle) {
      renderings.push(
        <React.Fragment key="errors">
          <a className="badge-link" href="#fatal-compile"><Badge color="danger"><Icon name="slash"/> Compilation</Badge></a>
        </React.Fragment>
      );
    }

    if(fatalFiddleDeploy) {
      renderings.push(
        <React.Fragment key="errors">
          <a className="badge-link" href="#fatal-deploy"><Badge color="danger"><Icon name="slash"/> Deployment</Badge></a>
        </React.Fragment>
      );
    }
    
    if(errors.length) renderings.push(
      <React.Fragment key="errors">
        <a className="badge-link" href="#errors"><Badge color="danger">{errors.length} error{errors.length > 1 ? "s" : ""}</Badge></a>
      </React.Fragment>
    );
    if(warnings.length) renderings.push(
      <React.Fragment key="warnings">
        <a className="badge-link" href="#warnings"><Badge color="warning">{warnings.length} warning{warnings.length > 1 ? "s" : ""}</Badge></a>
      </React.Fragment>
    );
    if(hasResult && !errors.length){
      renderings.push(
        <React.Fragment key="success">
          <Badge className="badge-link" color="success">Compiled</Badge>
          <FiddleDeployButton onDeployClick={(e) => this.props.onDeployClick(e)} />
        </React.Fragment>
      );
    }
    
    return (
      <div className={"compilation-summary " + ((hasResult || isLoading) ? "visible" : "")}>
        {renderings}
        {!(hasResult || isLoading) ? "&nbsp;" : ""}
      </div>
    );
  }
}

FiddleResultsSummary.propTypes = {
  errors: PropTypes.array,
  warnings: PropTypes.array,
  isLoading: PropTypes.bool,
  loadingMessage: PropTypes.string,
  hasResult: PropTypes.bool,
  fatalFiddle: PropTypes.string,
  fatalFiddleDeploy: PropTypes.string,
  onDeployClick: PropTypes.func
};

export default FiddleResultsSummary;
