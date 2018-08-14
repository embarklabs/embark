import PropTypes from "prop-types";
import React, {Component} from 'react';
import connect from "react-redux/es/connect/connect";
import {Alert, Page} from "tabler-react";
import {ensRecord, ensRecords} from "../actions";
import DataWrapper from "../components/DataWrapper";
import EnsRegister from "../components/EnsRegister";
import EnsLookup from "../components/EnsLookup";
import EnsResolve from "../components/EnsResolve";
import EnsRecords from "../components/EnsRecords";
import {getEnsRecords, isEnsEnabled} from "../reducers/selectors";

class EnsContainer extends Component {

  showEns() {
    return (
      <React.Fragment>
        <EnsLookup lookup={this.props.lookup}/>
        <EnsResolve resolve={this.props.resolve}/>
        <EnsRegister register={this.props.register}/>
        <DataWrapper shouldRender={this.props.ensRecords.length > 0} {...this.props} render={({ensRecords}) => (
          <EnsRecords ensRecords={ensRecords} />
        )} />
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
  isEnsEnabled: PropTypes.bool
};

function mapStateToProps(state) {
  return {
    ensRecords: getEnsRecords(state),
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

