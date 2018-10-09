import React from 'react';
import PropTypes from 'prop-types';
import {Treebeard, decorators} from 'react-treebeard';
import {Form} from 'tabler-react';

const Header = ({style, node}) => {
  const iconType = node.children ? 'folder' : 'file';
  const iconClass = `fe fe-${iconType}`;
  const iconStyle = {marginRight: '5px'};

  return (
    <div style={style.base}>
      <div style={style.title}>
        <i className={iconClass} style={iconStyle} />
        {node.name}
      </div>
    </div>
  );
};

Header.propTypes = {
  style: PropTypes.object,
  node: PropTypes.object
};

decorators.Header = Header;

class FileExplorer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showHidden: false
    };
  }

  onToggle(node, toggled) {
    node.active = true;
    if (node.children) {
      node.toggled = toggled;
    } else {
      this.props.fetchFile(node);
    }
    this.setState({cursor: node});
  }

  onHiddenToggle(e) {
    this.setState({showHidden: e.target.checked});
  }

  nodeEquals(a, b) {
    return a && b && a.path && b.path && a.name && b.name &&
      a.path === b.path &&
      a.name === b.name;
  }

  isNodeInPath(a, b) {
    return a && b && a.path && b.path &&
      a.path !== b.path &&
      b.path.indexOf(a.path) > -1;
  }

  filterHidden(nodes) {
    let filtered = [];
    if (!Array.isArray(nodes)) return filtered;

    // we need a foreach to build an array instead of a
    // filter to prevent mutating the original object (in props) 
    nodes.forEach(node => {
      const {showHidden, cursor} = this.state;
      if (!showHidden && node.isHidden) return;
      let updatedNode = {...node};

      // if it's a folder, filter the children
      if (node.children) {
        const children = this.filterHidden(node.children);
        if (children.length) {
          updatedNode.children = children;
        }
      }
      
      // if this is the selected node, set it as active
      if (this.nodeEquals(node, cursor)) {
        updatedNode.active = cursor.active;
        // if this node is the selected node and is a folder, set 
        // it as toggled (expanded) according to the selected node
        if (node.children) updatedNode.toggled = cursor.toggled;
      }
      // if this node is a folder, and it's a parent of the selected
      // folder, force toggle it
      if (node.children && this.isNodeInPath(node, cursor)) {
        updatedNode.toggled = true;
      }
      filtered.push(updatedNode);
    });

    return filtered;
  }

  render() {
    return (
      <React.Fragment>
        <Form.Switch type="checkbox" name="toggle" value={true} label="Show hidden files" onChange={this.onHiddenToggle.bind(this)} />
        <Treebeard
          data={this.filterHidden(this.props.files)}
          decorators={decorators}
          onToggle={this.onToggle.bind(this)}
        />
      </React.Fragment>
    );
  }
}

FileExplorer.propTypes = {
  files: PropTypes.array,
  fetchFile: PropTypes.func
};

export default FileExplorer;
