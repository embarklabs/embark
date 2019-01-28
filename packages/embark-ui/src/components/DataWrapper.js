import PropTypes from 'prop-types';
import React from "react";

import Loading from '../components/Loading';
import Error from '../components/Error';

const DataWrapper = ({error, loading, shouldRender, render, elseRender, ...rest}) => {
  if (error) {
    return <Error error={error} />;
  }

  if (shouldRender) {
    return render(rest);
  }

  if (loading) {
    return <Loading />;
  }

  if (elseRender) {
    return elseRender(rest);
  }

  return <React.Fragment />;
};

DataWrapper.propTypes = {
  error: PropTypes.string,
  loading: PropTypes.bool,
  render: PropTypes.func,
  elseRender: PropTypes.func,
  shouldRender: PropTypes.bool
};

export default DataWrapper;
