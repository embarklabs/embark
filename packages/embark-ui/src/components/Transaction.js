import React from 'react';
import {Link} from 'react-router-dom';
import {Row, Col, Card, CardHeader, CardBody} from 'reactstrap';
import PropTypes from 'prop-types';

import DebugButton from './DebugButton';
import Description from './Description';
import CardTitleIdenticon from './CardTitleIdenticon';
import {utils} from 'web3';


const Transaction = ({transaction, contracts}) => (
  <Row>
    <Col>
      <Card>
        <CardHeader>
          <CardTitleIdenticon id={transaction.hash}>
            Transaction {transaction.hash}
            <div className="float-right">
               <DebugButton contracts={contracts} transaction={transaction} />
             </div>
          </CardTitleIdenticon>
        </CardHeader>
        <CardBody>
          <dl className="row">
            <Description label="Block" value={<Link to={`/explorer/blocks/${transaction.blockNumber}`}>{transaction.blockNumber}</Link>} />
            <Description label="From" value={transaction.from} />
            <Description label="To" value={transaction.to} />
            <Description label="Value" value={`${utils.fromWei(transaction.value)} Ether`}/>
            <Description label="Input" value={transaction.input} />
            <Description label="Gas" value={transaction.gas} />
            <Description label="Gas price" value={`${transaction.gasPrice} Wei`} />
            <Description label="Nonce" value={transaction.nonce} />
          </dl>
        </CardBody>
      </Card>
    </Col>
  </Row>
);

Transaction.propTypes = {
  contracts: PropTypes.arrayOf(PropTypes.object),
  transaction: PropTypes.object
};

export default Transaction;
