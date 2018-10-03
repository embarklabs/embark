import PropTypes from 'prop-types';
import React from 'react';
import {Form, Button} from 'tabler-react';

class ApplicationPreviewContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      previewUrl: this.props.previewHomepage
    };
  }

  render() {
    return (
      <Form.Group>
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
                height="500"
                title="Preview"
                ref={(iframe) => this.previewIframe = iframe}
                onLoad={(e) => this.handlePreviewChange(e)} src={this.props.previewHomepage}>
        </iframe>
      </Form.Group>
    );
  }

  handlePreviewUrlChange(ev) {
    this.setState({previewUrl: ev.target.value});
  }

  handlePreviewChange(ev) {
    try {
      let url = ev.target.contentWindow.location.toString();
      this.setState({previewUrl: url});
    } catch(e) {
      // Nothing here.
    }
  }

  handlePreviewGo() {
    this.previewIframe.src = this.state.previewUrl;
  }
}

ApplicationPreviewContainer.propTypes = {
  previewHomepage: PropTypes.string
};

ApplicationPreviewContainer.defaultProps = {
  previewHomepage: window.location.protocol + '//' + window.location.host
};

export default ApplicationPreviewContainer;

