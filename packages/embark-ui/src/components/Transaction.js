import React from 'react';
import {Link} from 'react-router-dom';
import {Row, Col, Card, CardHeader, CardBody} from 'reactstrap';
import PropTypes from 'prop-types';

import DebugButton from './DebugButton';
import Description from './Description';
import CardTitleIdenticon from './CardTitleIdenticon';
import {utils} from 'web3';

function linkTemplate(to, text) {
  return <Link to={to}>{text}</Link>
}

function getLink(contracts, accounts, address) {
  if (accounts.find(account => account.address === address)) {
    return linkTemplate(`/explorer/accounts/${address}`, address);
  }
  const contract = contracts.find(contract => contract.deployedAddress === address);
  if (contract) {
    return linkTemplate(`/explorer/contracts/${contract.className}`, address);
  }
  return address
}

const Transaction = ({transaction, contracts, accounts}) => (
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
            <Description label="Block" value={linkTemplate(`/explorer/blocks/${transaction.blockNumber}`, transaction.blockNumber)} />
            <Description label="From" value={getLink(contracts, accounts, transaction.from)} />
            <Description label="To" value={getLink(contracts, accounts, transaction.to)} />
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
  accounts: PropTypes.arrayOf(PropTypes.object),
  transaction: PropTypes.object
};

export default Transaction;
