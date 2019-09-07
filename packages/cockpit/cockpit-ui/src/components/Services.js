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

const Service = ({service}) => (
  <Col xs={12} sm={6} md={4} xl={3}>
    <Widget02 header={service.name} mainText={service.description} icon={iconClasses(service.state)} color={colorClasses(service.state)} variant="1" />
  </Col>
);

Service.propTypes = {
  service: PropTypes.object
};

const Services = ({services}) => (
  <Row>
    {services
      .sort((a, b) => a.name < b.name ? 1 : 0)
      .map((service) => <Service key={service.name} service={service} />)}
  </Row>
);

Services.propTypes = {
  services: PropTypes.arrayOf(PropTypes.object)
};

export default Services;
