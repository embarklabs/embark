import PropTypes from 'prop-types';
import React from "react";

import Loading from '../components/Loading';
import Error from '../components/Error';

const DataWrapper = ({error, loading, shouldRender, render, ...rest}) => {
  if (error) {
    return <Error error={error} />;
  }

  if (loading) {
    return <Loading />;
  }

  if (shouldRender) {
    return render(rest);
  }

  return <React.Fragment />;
};

DataWrapper.propTypes = {
  error: PropTypes.string,
  loading: PropTypes.bool,
  render: PropTypes.func,
  shouldRender: PropTypes.bool
};

export default DataWrapper;
