import {AppSwitch} from '@coreui/react';
import {Label} from 'reactstrap';
import React from 'react';
import PropTypes from 'prop-types';
import {Treebeard, decorators} from 'react-treebeard';
import classNames from 'classnames';
import {DARK_THEME} from '../constants';

const isDarkTheme= (theme) => theme === DARK_THEME;

const style = (theme) => ({
  tree: {
    base: {
      listStyle: 'none',
      backgroundColor: isDarkTheme(theme) ? '#1C1C1C' : '#FFFFFF',
      color: isDarkTheme(theme) ? '#FFFFFF' : '#000000',
      padding: '10px 0 0 10px',
      margin: 0,
      overflow: 'auto',
      position: 'absolute',
      top: 0,
      bottom: '40px',
      left: 0,
      right: 0
    },
    node: {
      base: {
        position: 'relative',
        verticalAlign: 'middle'
      },
      link: {
        cursor: 'pointer',
        position: 'relative',
        padding: '0px 5px',
        display: 'block'
      },
      toggle: {
        base: {
          display: 'inline-block',
          marginRight: '10px'
        },
        wrapper: {
          margin: '-7px 0 0 0'
        },
        height: 7,
        width: 7,
        arrow: {
          fill: isDarkTheme(theme) ? '#FFFFFF' : '#000000',
          strokeWidth: 0
        }
      },
      header: {
        base: {
          display: 'inline-block'
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
          lineHeight: '24px'
        }
      },
      subtree: {
        listStyle: 'none',
        paddingLeft: '22px'
      },
      loading: {
        color: '#E2C089'
      }
    }
  }
});


const Header = ({style, node}) => {
  let icon;

  if (!node.children) {
    const extension = node.path.split('.').pop();
    switch(extension) {
      case 'html':
        icon = 'text-danger fa fa-html5';
        break;
      case 'css':
        icon = 'text-warning fa fa-css3';
        break;
      case 'js':
      case 'jsx':
        icon = 'text-primary icon js-icon';
        break;
      case 'json':
        icon = 'text-success icon hjson-icon';
        break;
      case 'sol':
        icon = 'text-warning icon solidity-icon';
        break;
      default:
        icon = 'fa fa-file-o';
    }
  } else {
    switch(node.name) {
      case 'dist':
        icon = 'text-danger icon easybuild-icon';
        break;
      case 'config':
        icon = 'text-warning fa fa-cogs';
        break;
      case 'contracts':
        icon = 'text-success icon appstore-icon';
        break;
      case 'app':
        icon = 'text-primary fa fa-code';
        break;
      case 'test':
        icon = 'icon test-dir-icon';
        break;
      case 'node_modules':
        icon = 'fa fa-folder-o';
        break;
      default:
        icon = 'fa fa-folder';
    }

  }

  return (
    <div className="mb-1" style={style.base}>
      <div style={style.title}>
        <i className={classNames('mr-1', icon)} />
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
    this.state = {activeNodes: []};
  }

  onToggle(node, toggled) {
    node.active = toggled;
    if (node.children) {
      node.toggled = toggled;
    } else {
      this.props.fetchFile(node);
    }

    let newNodes;
    if (toggled) {
      newNodes = this.state.activeNodes;
      newNodes.push(node)
    } else {
      newNodes = this.state.activeNodes.filter(n => !this.nodeEquals(node, n))
    }
    this.setState({activeNodes: newNodes});
  }

  nodeEquals(a, b) {
    return a && b && a.path && b.path && a.name && b.name &&
      a.path === b.path &&
      a.name === b.name;
  }

  data(nodes) {
    let filtered = [];
    if (!Array.isArray(nodes)) return filtered;

    const activeNodes = this.state.activeNodes;
    const showHidden = this.props.showHiddenFiles;

    return nodes.reduce((filtered, node) => {
      if (!showHidden && node.isHidden) return filtered;
      let updatedNode = {...node};

      if (node.children) {
        const children = this.data(node.children);
        if (children.length) {
          updatedNode.children = children;
        }
      }

      if (activeNodes.find(n => this.nodeEquals(node, n))) {
        updatedNode.active = true;
        if (node.children) updatedNode.toggled = true;
      }

      filtered.push(updatedNode);
      return filtered;
    }, []);
  }

  render() {
    return (
      <div className="d-flex flex-column">
        <Treebeard
          data={this.data(this.props.files)}
          decorators={decorators}
          onToggle={this.onToggle.bind(this)}
          style={style(this.props.theme)}
        />

        <Label className="hidden-toogle mb-0 pt-2 pr-2 pb-1 border-top text-right">
          <span className="mr-2 align-top">Show hidden files</span>
          <AppSwitch color="success" variant="pill" size="sm" onChange={this.props.toggleShowHiddenFiles}/>
        </Label>
       </div>
    );
  }
}

FileExplorer.propTypes = {
  files: PropTypes.array,
  fetchFile: PropTypes.func,
  showHiddenFiles: PropTypes.bool,
  toggleShowHiddenFiles: PropTypes.func,
  theme: PropTypes.string
};

export default FileExplorer;
