import React from 'react';
import {Button, Modal, ModalHeader, ModalBody, ModalFooter} from 'reactstrap';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {isDarkTheme} from '../utils/utils';

class DeleteModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {modal: false};
  }

  toggle(open) {
    if (open !== undefined) {
      return this.setState({modal: open});
    }
    this.setState({modal: !this.state.modal});
  }

  render() {
    return (
      <Modal contentClassName={classNames({'dark-theme': isDarkTheme(this.props.theme)})}
             isOpen={this.state.modal}
             toggle={(open) => this.toggle(open)}>
        <ModalHeader toggle={() => this.toggle(false)}>Are you sure you want to remove this?</ModalHeader>
        <ModalBody>
          <p>This change is permanent and cannot be undone (from the Cockpit)</p>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => this.toggle(false)}>Cancel</Button>
          <Button color="danger" onClick={() => {this.props.delete(); this.toggle(false);}}>Delete</Button>
        </ModalFooter>
      </Modal>
    )
  }
}

DeleteModal.propTypes = {
  delete: PropTypes.func,
  theme: PropTypes.string
};

export default DeleteModal;
