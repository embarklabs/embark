import React from 'react';
import PropTypes from 'prop-types';
import {Button, InputGroup, Input, InputGroupAddon} from 'reactstrap';
import FontAwesome from 'react-fontawesome';

class Preview extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      previewUrl: props.previewUrl
    };
  }

  handlePreviewUrlChange(ev) {
    this.setState({previewUrl: ev.target.value});
    this.props.updatePreviewUrl(ev.target.value);
  }

  handlePreviewGo() {
    this.previewIframe.src = this.state.previewUrl;
    this.props.updatePreviewUrl(this.state.previewUrl);
  }

  render() {
    return (
      <div className='h-100 d-flex flex-column'>
        <InputGroup>
          <Input placeholder="URL"
                 value={this.state.previewUrl}
                 onChange={(e) => this.handlePreviewUrlChange(e)}/>
          <InputGroupAddon addonType="append">
            <Button className="ml-auto" color="primary" onClick={(e) => this.handlePreviewGo(e)}>
              <FontAwesome name="refresh"/>
            </Button>
          </InputGroupAddon>
        </InputGroup>
        <iframe width="100%"
                height="100%"
                title="Preview"
                ref={(iframe) => this.previewIframe = iframe}
                src={this.state.previewUrl}>
        </iframe>
      </div>
    );
  }
}

Preview.propTypes = {
  previewUrl: PropTypes.string,
  updatePreviewUrl: PropTypes.func,
};

export default Preview;

