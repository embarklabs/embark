import PropTypes from 'prop-types';
import React from 'react';

class ApplicationPreviewContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      previewUrl: props.previewUrl || 'http://localhost:8000'
    };
  }

  render() {
    return (
      <div>
        <div className="input-group mb-3">
          <input type="text" className="form-control" placeholder="URL" ref={(input) => this.locationInput = input} value={this.props.previewUrl} />
          <div className="input-group-append">
            <button className="btn btn-outline-secondary" type="button" onClick={(e) => this.handlePreviewGo(e)}>Go</button>
          </div>
        </div>
        <iframe width="100%" height="500" title="Preview" ref={(iframe) => this.previewIframe = iframe} onLoad={(e) => this.handlePreviewChange(e)} src="http://localhost:8000"></iframe>
      </div>
    );
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
    this.previewIframe.src = this.locationInput.value;
  }
}

ApplicationPreviewContainer.propTypes = {
  previewUrl: PropTypes.string
};

export default ApplicationPreviewContainer;

