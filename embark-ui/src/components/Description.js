import PropTypes from 'prop-types';
import React from 'react';

const Description = ({label, value}) => (
  <React.Fragment>
    <dt className="col-sm-3">{label}</dt>
    <dd className="col-sm-9 text-wrap">{value}</dd>
  </React.Fragment>
);

Description.propTypes = {
  label: PropTypes.any,
  value: PropTypes.any
};

export default Description
