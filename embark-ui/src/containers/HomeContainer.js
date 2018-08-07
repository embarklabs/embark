import React, {Component} from 'react';
import {connect} from 'react-redux';
import {Page} from "tabler-react";

import Status from '../components/Status';
import Console from '../components/Console';

class HomeContainer extends Component {
  render() {
    return (
      <React.Fragment>
        <Page.Title className="my-5">Dashboard</Page.Title>
        <Status />
        <Console />
      </React.Fragment>
    );
  }
}

export default connect(
  null,
  null,
)(HomeContainer);
