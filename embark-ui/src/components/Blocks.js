import React from 'react';
import {Link} from "react-router-dom";
import {Row, Col, Table} from 'reactstrap';

import PropTypes from 'prop-types';

const Blocks = ({blocks}) => (
  <Row>
    <Col>
      <h1>Blocks</h1>
      <Table responsive className="text-nowrap">
        <thead>
          <tr>
            <th>Number</th>
            <th>Mined On</th>
            <th>Gas Used</th>
            <th>TX Count</th>
          </tr>
        </thead>  
        <tbody>
          {
            blocks.map((block) => {
              return (
                <tr key={block.number}>
                  <td><Link to={`/embark/explorer/blocks/${block.number}`}>{block.number}</Link></td>
                  <td>{new Date(block.timestamp * 1000).toLocaleString()}</td>
                  <td>{block.gasUsed}</td>
                  <td>{block.transactions.length}</td>
                </tr>
              );
            })
          }
        </tbody>
      </Table>
    </Col>
  </Row>
);

Blocks.propTypes = {
  blocks: PropTypes.arrayOf(PropTypes.object)
};

export default Blocks;
