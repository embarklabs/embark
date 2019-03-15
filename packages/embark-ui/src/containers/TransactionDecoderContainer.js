import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import qs from 'qs';
import {withRouter} from 'react-router-dom';
import TransactionDecoder from '../components/TransactionDecoder';
import PageHead from '../components/PageHead';
import { Row, Col } from 'reactstrap';
import { decodedTransaction as decodedTransactionAction } from '../actions';
import {getDecodedTransaction} from "../reducers/selectors";

const getQueryParams = (props) => {
  return qs.parse(props.location.search, {
    ignoreQueryPrefix: true
  });
};

class TransactionDecoderContainer extends Component {
  componentDidMount() {
    const { hash } = getQueryParams(this.props);
    if (hash) {
      this.props.fetchDecodedTransaction(hash);
    }
  }

  componentDidUpdate(prevProps) {
    const { hash } = getQueryParams(this.props);
    const prevHash = getQueryParams(prevProps).hash;

    if (hash && hash !== prevHash) {
      this.props.fetchDecodedTransaction(hash);
    }
  }

  render() {
    return (
      <React.Fragment>
        <PageHead title="Transaction Decoder" description="Decode values encoded in a transaction" />
        <Row>
          <Col>
            <TransactionDecoder transaction={this.props.transaction}
                                transactionHash={getQueryParams(this.props).hash}/>
          </Col>
        </Row>
      </React.Fragment>
    );
  }
}

TransactionDecoderContainer.propTypes = {
  fetchDecodedTransaction: PropTypes.func,
  transaction: PropTypes.object
};

function mapStateToProps(state) {
  return {
    transaction: getDecodedTransaction(state),
    error: state.errorMessage,
    loading: state.loading
  };
}
export default withRouter(connect(
  mapStateToProps,
  {
    fetchDecodedTransaction: decodedTransactionAction.request
  }
)(TransactionDecoderContainer));
