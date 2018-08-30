import React from 'react';
import PropTypes from 'prop-types';
import {Treebeard, decorators} from 'react-treebeard';

const Header = ({style, node}) => {
  const iconType = node.children ? 'folder' : 'file';
  const iconClass = `fe fe-${iconType}`;
  const iconStyle = {marginRight: '5px'};

  return (
      <div style={style.base}>
          <div style={style.title}>
              <i className={iconClass} style={iconStyle}/>
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
  constructor(props){
    super(props);
    this.state = {};
  }
  onToggle(node, toggled){
    node.active = true;
    if(node.children) {
      node.toggled = toggled;
    }
    this.setState({ cursor: node });
  }
  render(){
    return (
      <Treebeard
        data={this.props.files}
        decorators={decorators}
        onToggle={(node, toggled) => this.onToggle(node, toggled)}
      />
    );
  }
}

FileExplorer.propTypes = {
  files: PropTypes.array
};

export default FileExplorer;
