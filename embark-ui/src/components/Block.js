import React from 'react';
import {Row, Col} from 'reactstrap';
import PropTypes from 'prop-types';

import Description from './Description';

const Block = ({block}) => (
  <Row>
    <Col>
      <h1>Block {block.number}</h1>
      <dl class="row">
        <Description label="Hash" value={block.hash} />
        <Description label="Timestamp" value={block.timestamp} />
        <Description label="Difficulty" value={block.difficulty} />
        <Description label="Gas used" value={block.gasUsed} />
        <Description label="Gas limit" value={block.gasLimit} />
        <Description label="Miner" value={block.miner} />
        <Description label="Mix hash" value={block.mixHash} />
        <Description label="Nonce" value={block.nonce} />
        <Description label="Parent hash" value={block.parentHash} />
        <Description label="Transaction root" value={block.transactionsRoot} />
        <Description label="Receipts root" value={block.receiptsRoot} />
        <Description label="State root" value={block.stateRoot} />
        <Description label="SHA3 uncles" value={block.sha3Uncles} />
        <Description label="Size" value={block.size} />
        <Description label="Total difficulty" value={block.totalDifficulty} />
        <Description label="Extra data" value={block.extraData} />
        <Description label="Logs bloom" value={block.logsBloom} />
      </dl>
    </Col>
  </Row>
);

Block.propTypes = {
  block: PropTypes.object
};

export default Block;
