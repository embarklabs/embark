import React from 'react';
import PropTypes from 'prop-types';
import {Treebeard, decorators} from 'react-treebeard';
import {Input, Label, FormGroup} from 'reactstrap';

const style = {
  tree: {
    base: {
      height: '100%',
      listStyle: 'none',
      backgroundColor: '#1C1C1C',
      margin: 0,
      padding: 0,
      color: '#9DA5AB',
      fontFamily: 'lucida grande ,tahoma,verdana,arial,sans-serif',
      fontSize: '14px'
    },
    node: {
      base: {
        position: 'relative'
      },
      link: {
        cursor: 'pointer',
        position: 'relative',
        padding: '0px 5px',
        display: 'block'
      },
      activeLink: {
        background: '#31363F'
      },
      toggle: {
        base: {
          position: 'relative',
          display: 'inline-block',
          verticalAlign: 'top',
          marginLeft: '-5px',
          height: '24px',
          width: '24px'
        },
        wrapper: {
          position: 'absolute',
          top: '50%',
          left: '50%',
          margin: '-7px 0 0 -7px',
          height: '14px'
        },
        height: 14,
        width: 14,
        arrow: {
          fill: '#9DA5AB',
          strokeWidth: 0
        }
      },
      header: {
        base: {
          display: 'inline-block',
          verticalAlign: 'top',
          color: '#9DA5AB'
        },
        connector: {
          width: '2px',
          height: '12px',
          borderLeft: 'solid 2px black',
          borderBottom: 'solid 2px black',
          position: 'absolute',
          top: '0px',
          left: '-21px'
        },
        title: {
          lineHeight: '24px',
          verticalAlign: 'middle'
        }
      },
      subtree: {
        listStyle: 'none',
        paddingLeft: '19px'
      },
      loading: {
        color: '#E2C089'
      }
    }
  }
};

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
      <div className="h-100 d-flex flex-column">
        <FormGroup check>
          <Label check>
            <Input type="checkbox" onChange={this.onHiddenToggle.bind(this)} />
            Show hidden files
          </Label>
        </FormGroup>
        <Treebeard
          data={this.filterHidden(this.props.files)}
          decorators={decorators}
          onToggle={this.onToggle.bind(this)}
          style={style}
        />
      </div>
    );
  }
}

FileExplorer.propTypes = {
  files: PropTypes.array,
  fetchFile: PropTypes.func
};

export default FileExplorer;
