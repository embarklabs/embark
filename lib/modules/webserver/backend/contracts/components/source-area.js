/*global hljs*/
import React from 'react';
import PropTypes from 'prop-types';

class SourceArea extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sourceCode: ""
    };
  }

  componentDidMount() {
    let colorCodedText = hljs.highlight('javascript', this.props.source, true).value;
    this.setState({sourceCode: colorCodedText});
  }

  render() {
    return <div className="card">
      <div className="card-header">
        <h3 className="card-title">{this.props.definition.className}</h3>
        <div className="card-options">
          <small>{this.props.definition.filename}</small>
        </div>
      </div>
      <div className="card-body">
        <pre dangerouslySetInnerHTML={{__html: this.state.sourceCode}}></pre>
      </div>
    </div>;
  }
}

SourceArea.propTypes = {
  definition: PropTypes.object,
  source: PropTypes.string
};

export default SourceArea;
