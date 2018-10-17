import React from 'react';

const Description = ({label, value}) => (
  <React.Fragment>
    <dt class="col-sm-3">{label}</dt>
    <dd class="col-sm-9 text-wrap">{value}</dd>
  </React.Fragment>
);

export default Description