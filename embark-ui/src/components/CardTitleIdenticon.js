import React from 'react';
import {CardTitle} from 'reactstrap';
import Blockies from 'react-blockies';

const CardTitleIdenticon = ({id, children}) => (
  <CardTitle><Blockies seed={id} className="rounded"/><span className="ml-2 align-top">{children}</span></CardTitle>
)

export default CardTitleIdenticon