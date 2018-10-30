import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import qs from 'qs';
import {withRouter} from 'react-router-dom';
import TransactionDecoder from '../components/TransactionDecoder';
import { Row, Col } from 'reactstrap';
import { transaction as transactionAction } from '../actions';
import {getTransaction} from "../reducers/selectors";

const getQueryParams = (props) => {
  return qs.parse(props.location.search, {
    ignoreQueryPrefix: true
  });
};

class TransactionDecoderContainer extends Component {
  componentDidMount() {
    const { hash } = getQueryParams(this.props);
    if (hash) {
      this.props.fetchTransaction(hash);
    }
  }

  componentDidUpdate(prevProps) {
    const hash = getQueryParams(this.props).hash;
    const prevHash = getQueryParams(prevProps).hash;

    if (hash && hash !== prevHash) {
      this.props.fetchTransaction(hash);
    }
  }

  render() {
    return (
      <Row>
        <Col>
          <TransactionDecoder transaction={this.props.transaction}
                              transactionHash={getQueryParams(this.props).hash}/>
        </Col>
      </Row>
    );
  }
}

TransactionDecoderContainer.propTypes = {
  fetchTransaction: PropTypes.func,
  transaction: PropTypes.object
};

function mapStateToProps(state, props) {
  return {
    transaction: getTransaction(state, getQueryParams(props).hash),
    error: state.errorMessage,
    loading: state.loading
  };
}
export default withRouter(connect(
  mapStateToProps,
  {
    fetchTransaction: transactionAction.request
  }
)(TransactionDecoderContainer));
