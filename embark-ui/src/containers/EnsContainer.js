import PropTypes from "prop-types";
import React, {Component} from 'react';
import connect from "react-redux/es/connect/connect";
import {Alert, Page} from "tabler-react";
import {ensRecord, ensRecords} from "../actions";
import EnsRegister from "../components/EnsRegister";
import EnsLookup from "../components/EnsLookup";
import EnsResolve from "../components/EnsResolve";
import {getEnsRecords, isEnsEnabled, getEnsErrors} from "../reducers/selectors";

class EnsContainer extends Component {

  showEns() {
    return (
      <React.Fragment>
        <EnsLookup lookup={this.props.lookup} ensRecords={this.props.ensRecords}/>
        <EnsResolve resolve={this.props.resolve} ensRecords={this.props.ensRecords}/>
        <EnsRegister register={this.props.register} ensRecords={this.props.ensRecords} ensErrors={this.props.ensErrors}/>
      </React.Fragment>
    );
  }

  showWarning() {
    return <Alert type="warning">Please enable Ens in Embark first</Alert>;
  }

  render() {
    return (
      <Page.Content title="Ens">
        {this.props.isEnsEnabled ? this.showEns() : this.showWarning()}
      </Page.Content>
    );
  }
}

EnsContainer.propTypes = {
  ensRecords: PropTypes.array,
  resolve: PropTypes.func,
  lookup: PropTypes.func,
  register: PropTypes.func,
  isEnsEnabled: PropTypes.bool,
  ensErrors: PropTypes.string
};

function mapStateToProps(state) {
  return {
    ensRecords: getEnsRecords(state),
    ensErrors: getEnsErrors(state),
    isEnsEnabled: isEnsEnabled(state)
  };
}

export default connect(
  mapStateToProps,
  {
    resolve: ensRecord.resolve,
    lookup: ensRecord.lookup,
    register: ensRecords.post
  }
)(EnsContainer);

