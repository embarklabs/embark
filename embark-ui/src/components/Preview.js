import PropTypes from 'prop-types';
import React from 'react';
import {Form, Button} from 'tabler-react';

class Preview extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      previewUrl: this.props.previewUrl
    };
  }

  handlePreviewUrlChange(ev) {
    this.setState({previewUrl: ev.target.value});
  }

  handlePreviewChange(ev) {
    try {
      let url = ev.target.contentWindow.location.toString();
      this.setState({previewUrl: url});
    } catch(e) {}
  }

  handlePreviewGo() {
    this.previewIframe.src = this.state.previewUrl;
  }

  render() {
    return (
      <Form.Group className='h-100'>
        <Form.InputGroup>
          <Form.Input placeholder="URL"
                      value={this.state.previewUrl}
                      className="form-control"
                      onChange={(e) => this.handlePreviewUrlChange(e)} />
          <Form.InputGroupAppend>
            <Button color="primary" onClick={(e) => this.handlePreviewGo(e)}>Go</Button>
          </Form.InputGroupAppend>
        </Form.InputGroup>
        <iframe width="100%"
                height="100%"
                title="Preview"
                ref={(iframe) => this.previewIframe = iframe}
                onLoad={(e) => this.handlePreviewChange(e)} src={this.state.previewUrl}>
        </iframe>
      </Form.Group>
    );
  }
}

Preview.propTypes = {
  previewUrl: PropTypes.string
};

Preview.defaultProps = {
  previewUrl: window.location.protocol + '//' + window.location.host
};

export default Preview;

