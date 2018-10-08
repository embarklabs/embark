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
    this.state = {
      files: this.props.files
    };
  }

  onToggle(node, toggled){
    let oldNode = this.state.cursor;
    if(oldNode) {
      oldNode.active = false;
    }
    node.active = true;
    if(node.children) {
      node.toggled = toggled;
    } else {
      this.props.fetchFile(node);
    }
    this.setState({ cursor: node });
  }

  onHiddenToggle(value){
    this.setState({files: this.props.files.filter((file) => {
        return;
      })
    });
  }

  render(){
    return (
      <React.Fragment>
        <Form.Switch type="checkbox" name="toggle" value={true} label="Show hidden files" ref={(input) => { this.showHidden = input; }} onToggle={this.onHiddenToggle.bind(this)} />
        <Treebeard
          data={this.props.files}
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
