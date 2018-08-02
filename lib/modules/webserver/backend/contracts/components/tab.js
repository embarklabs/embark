import React from 'react';
import PropTypes from 'prop-types';

class Tab extends React.Component {
  render() {
    return (
      this.props.selectedTab === this.props.id && <div id={this.props.id}>
        {this.props.children}
      </div>
    );
  }
}

Tab.propTypes = {
  selectedTab: PropTypes.string,
  id: PropTypes.string,
  children: PropTypes.element
};

export default Tab;
