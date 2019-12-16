import PropTypes from "prop-types";
import React, {Component} from 'react';
import connect from "react-redux/es/connect/connect";
import {Alert, Row, Col} from 'reactstrap';
import {ensRecord, ensRecords} from "../actions";
import EnsRegister from "../components/EnsRegister";
import EnsLookup from "../components/EnsLookup";
import EnsResolve from "../components/EnsResolve";
import Loading from "../components/Loading";
import PageHead from "../components/PageHead";
import {getEnsRecords, isEnsEnabled, getEnsErrors, isLoading} from "../reducers/selectors";

class EnsContainer extends Component {

  componentDidMount() {
    // Fire off resolve to determine if ENS api endpoints have been registered.
    // This will tell us if ENS is enabled or not.
    this.props.resolve();
  }

  showEns() {
    return (
      <React.Fragment>
        <PageHead title="ENS" description="Interact with ENS configured for Embark" />
        <Row className="justify-content-md-center">
          <Col xs="12" sm="9" lg="6">
            <EnsLookup lookup={this.props.lookup} ensRecords={this.props.ensRecords}/>
            <EnsResolve resolve={this.props.resolve} ensRecords={this.props.ensRecords}/>
            <EnsRegister register={this.props.register} ensRecords={this.props.ensRecords} ensErrors={this.props.ensErrors}/>
          </Col>
        </Row>
      </React.Fragment>
    );
  }

  showWarning() {
    return <Alert color="warning">Please enable Ens in Embark first</Alert>;
  }

  render() {
    return (
      <React.Fragment>
        {this.props.isLoading && <Loading></Loading>}
        {!this.props.isLoading && this.props.isEnsEnabled ? this.showEns() : this.showWarning()}
      </React.Fragment>
    );
  }
}

EnsContainer.propTypes = {
  ensRecords: PropTypes.array,
  resolve: PropTypes.func,
  lookup: PropTypes.func,
  register: PropTypes.func,
  isEnsEnabled: PropTypes.bool,
  ensErrors: PropTypes.string,
  isLoading: PropTypes.bool
};

function mapStateToProps(state) {
  return {
    ensRecords: getEnsRecords(state),
    ensErrors: getEnsErrors(state),
    isEnsEnabled: isEnsEnabled(state),
    isLoading: isLoading(state)
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

