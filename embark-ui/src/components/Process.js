import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {Page} from "tabler-react";
import Convert from 'ansi-to-html';
const convert = new Convert();

class Process extends Component {
  render() {
    const {processLogs, process}= this.props;
    return (
      <Page.Content title={process.name}>
        <p className="text-capitalize">State: {process.state}</p>
        <div className="logs">
          {
            processLogs.map((item, i) => <p key={i} className={item.logLevel} dangerouslySetInnerHTML={{__html: convert.toHtml(item.msg)}}></p>)
          }
        </div>
      </Page.Content>
    );
  }
}

Process.propTypes = {
  process: PropTypes.object,
  processLogs: PropTypes.arrayOf(PropTypes.object)
};

export default Process;
