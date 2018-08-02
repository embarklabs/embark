import React from 'react';
import PropTypes from 'prop-types';

class CardAlert extends React.Component {
  render() {
    return this.props.show ? <div className="card-alert alert alert-danger mb-0">{this.props.message}</div> : '';
  }
}

CardAlert.propTypes = {
  show: PropTypes.bool,
  message: PropTypes.string
};

export default CardAlert;
