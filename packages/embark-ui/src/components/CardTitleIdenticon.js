import PropTypes from "prop-types";
import React from 'react';
import {CardTitle} from 'reactstrap';
import Blockies from 'react-blockies';

const CardTitleIdenticon = ({id, children}) => (
  <CardTitle>
    <Blockies seed={id} className="rounded"/><span className="ml-2 align-top text-truncate">{children}</span>
  </CardTitle>
);

CardTitleIdenticon.propTypes = {
  id: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array,
    PropTypes.string
  ])
};

export default CardTitleIdenticon;
