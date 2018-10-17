import PropTypes from "prop-types";
import React from 'react';
import {Row, Col} from 'reactstrap';
import classNames from 'classnames';
import Widget02 from './Widget02';

function colorClasses(state){
  return classNames('', {
    'success': state === 'on',
    'danger': state !== 'on'
  });
}

function iconClasses(state){
  return classNames('fa', {
    'fa-check': state === 'on',
    'fa-times': state !== 'on'
  });
}

const Process = ({process}) => (
  <Col sm={6} lg={2}>
    <Widget02 header={process.name} mainText={process.description} icon={iconClasses(process.state)} color={colorClasses(process.state)} variant="1" />
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
