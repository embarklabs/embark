import PropTypes from 'prop-types';
import React from 'react';

class ApplicationPreviewContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // TODO(andremedeiros): Figure out how to pull this from the actual host.
      previewUrl: this.props.previewHomepage
    };
  }

  render() {
    return (
      <div>
        <div className="input-group mb-3">
          <input type="text" className="form-control" placeholder="URL" value={this.state.previewUrl} onChange={(e) => this.handlePreviewUrlChange(e)} />
          <div className="input-group-append">
            <button className="btn btn-outline-secondary" type="button" onClick={(e) => this.handlePreviewGo(e)}>Go</button>
          </div>
        </div>
        <iframe width="100%" height="500" title="Preview" ref={(iframe) => this.previewIframe = iframe} onLoad={(e) => this.handlePreviewChange(e)} src={this.props.previewHomepage}></iframe>
      </div>
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
  previewHomepage: 'http://localhost:8000'
};

export default ApplicationPreviewContainer;

