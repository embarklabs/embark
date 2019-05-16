/*global web3*/
import React from 'react';

import EmbarkJS from './embarkArtifacts/embarkjs';
import config from './embarkArtifacts/config/blockchain';


class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true
    };
  }

  componentDidMount() {
    EmbarkJS.Blockchain.connect(config, (err) => {
      if (err) {
        throw err;
      }
      this.setState({loading: false});
    });
  }


  render() {
   if (this.state.loading) {
     return 'Loading...';
   }
   return 'Ready!';
  }
}

export default App;
