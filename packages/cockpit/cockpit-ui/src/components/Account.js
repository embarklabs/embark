import React from 'react';
import {Row, Col, Card, CardHeader, CardBody} from 'reactstrap';
import PropTypes from 'prop-types';

import Description from './Description';
import CardTitleIdenticon from './CardTitleIdenticon';

const Account = ({account}) => (
  <Row>
    <Col>
      <Card>
        <CardHeader>
          <CardTitleIdenticon id={account.address}>{account.address}</CardTitleIdenticon>
        </CardHeader>
        <CardBody>
          <dl className="row">
            <Description label="Balance" value={account.balance} />
            <Description label="Transaction count" value={account.transactionCount} />
          </dl>
        </CardBody>
      </Card>
    </Col>
  </Row>
);

Account.propTypes = {
  account: PropTypes.object
};

export default Account;
