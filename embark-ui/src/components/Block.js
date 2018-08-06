import React from 'react';
import {
  Page
} from "tabler-react";
import PropTypes from 'prop-types';

const Block = ({block}) => (
  <Page.Content title={`Block ${block.number}`}>
    <p>Timestamp: {block.timestamp}</p>
    <p>Gas used: {block.gasUsed}</p>
  </Page.Content>
);

Block.propTypes = {
  block: PropTypes.object
};

export default Block;
