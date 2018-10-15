import PropTypes from "prop-types";
import React from 'react';
import {Row, Col, Card} from 'reactstrap';
import classNames from 'classnames';

function badgeClasses(state){
  return classNames('badge p-1 mr-3', {
    'bg-success': state === 'running',
    'bg-danger': state !== 'running'
  });
}

function iconClasses(state){
  return classNames('fa', {
    'fa-check': state === 'running',
    'fa-x': state !== 'running'
  });
}

const Process = ({process}) => (
  <Col sm={6} lg={3}>
    <Card className="p-3">
      <div className="d-flex align-items-center">
        <span className={badgeClasses(process.state)}>
          <i className={iconClasses(process.state)}></i>
        </span>
        <div>
          <h4 className="text-capitalize m-0">{process.name} ({process.state})</h4>
        </div>
      </div>
    </Card>
  </Col>
);

Process.propTypes = {
  process: PropTypes.object
};

const Processes = ({processes}) => (
  <Row>
    {processes.map((process) => <Process key={process.name} process={process} />)}
  </Row>
);

Processes.propTypes = {
  processes: PropTypes.arrayOf(PropTypes.object)
};

export default Processes;
