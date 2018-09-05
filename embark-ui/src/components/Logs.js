import React from 'react';
import autoscroll from 'autoscroll-react';

class Logs extends React.Component {
  render() {
    return (
      <div className="logs" {...this.props}>
        {this.props.children}
      </div>
    );
  }
}

export default autoscroll(Logs);
