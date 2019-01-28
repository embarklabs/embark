import React from 'react';
import {UncontrolledTooltip} from 'reactstrap';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import FontAwesome from 'react-fontawesome';

import {removeFile as removeFileAction, saveFile as saveFileAction, saveFolder as saveFolderAction} from '../actions';
import AddFileModal from '../components/AddFileModal';
import AddFolderModal from '../components/AddFolderModal';
import { getTheme } from '../reducers/selectors';

class FileExplorerRowContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {active: false};
    this.addFileModal = React.createRef();
    this.addFolderModal = React.createRef();
  }

  activateNode() {
    this.setState({active : true});
  }

  deactivateNode() {
    this.setState({active : false});
  }

  renderAction() {
    return (
      <span className="float-right mr-2">
        {this.props.node.children &&
          <React.Fragment>
            <span id="add-file"
                  className="pointer"
                  onClick={() => this.addFileModal.current.toggle()}>
              <FontAwesome name="plus" className="text-success mr-2" />
            </span>
            <span id="add-folder"
                  className="pointer"
                  onClick={() => this.addFolderModal.current.toggle()}>
              <FontAwesome name="folder-open" className="text-success mr-2" />
            </span>
            <UncontrolledTooltip placement="bottom" target="add-file">
              Add File
            </UncontrolledTooltip>
            <UncontrolledTooltip placement="bottom" target="add-folder">
              Add Folder
            </UncontrolledTooltip>
            <AddFileModal theme={this.props.theme} node={this.props.node} saveFile={this.props.saveFile} ref={this.addFileModal} />
            <AddFolderModal theme={this.props.theme} node={this.props.node} saveFolder={this.props.saveFolder} ref={this.addFolderModal} />
          </React.Fragment>
        }
        <span id="delete"
              style={{cursor: "pointer"}}
              onClick={() => this.props.removeFile(this.props.node)}>
          <FontAwesome name="trash" className="text-danger" />
        </span>
        <UncontrolledTooltip placement="bottom" target="delete">
          Delete
        </UncontrolledTooltip>
      </span>
    )
  }

  render() {
    return (
      <div style={this.props.style.container[0]}
           onMouseEnter={() => this.activateNode()}
           onMouseLeave={() => this.deactivateNode()}>
        <span onClick={this.props.onClick}>
          {this.props.node.children && <this.props.decorators.Toggle style={this.props.style.toggle}/>}
          <this.props.decorators.Header node={this.props.node} style={this.props.style.header}/>
        </span>
        {this.state.active && this.renderAction()}
      </div>
    )
  }
}

FileExplorerRowContainer.propTypes = {
  onClick: PropTypes.func,
  removeFile: PropTypes.func,
  saveFile: PropTypes.func,
  saveFolder: PropTypes.func,
  style: PropTypes.object,
  node: PropTypes.object,
  theme: PropTypes.string
};

const mapStateToProps = (state) => {
  return {
    theme: getTheme(state)
  }
}

export default connect(
  mapStateToProps,
  {
    removeFile: removeFileAction.request,
    saveFile: saveFileAction.request,
    saveFolder: saveFolderAction.request
  }
)(FileExplorerRowContainer);
