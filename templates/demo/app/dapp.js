import React from 'react';
import ReactDOM from 'react-dom';
import { Tabs, Tab } from 'react-bootstrap';

import EmbarkJS from 'Embark/EmbarkJS';
import Blockchain from './components/blockchain';
import Whisper from './components/whisper';
import Storage from './components/storage';

import './dapp.css';

class App extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      whisperEnabled: false,
      storageEnabled: false
    }
  }

  componentDidMount(){ 
    EmbarkJS.onReady(() => {
      if (EmbarkJS.isNewWeb3()) {
        EmbarkJS.Messages.Providers.whisper.getWhisperVersion((err, version) => { 
          if(!err)
              this.setState({whisperEnabled: true})
            else
              console.log(err);
        });
      } else {
        if (EmbarkJS.Messages.providerName === 'whisper') {
          EmbarkJS.Messages.getWhisperVersion((err, version) => {
            if(!err)
              this.setState({whisperEnabled: true})
            else
              console.log(err);
          });
        }
      }

      this.setState({
        storageEnabled: true
      });
    });
  }


  _renderStatus(title, available){
    let className = available ? 'pull-right status-online' : 'pull-right status-offline';
    return <React.Fragment>
      {title} 
      <span className={className}></span>
    </React.Fragment>;
  }

  render(){
    return (<div><h3>Embark - Usage Example</h3>
      <Tabs defaultActiveKey={1} id="uncontrolled-tab-example">
        <Tab eventKey={1} title="Blockchain">
          <Blockchain />
        </Tab>
        <Tab eventKey={2} title={this._renderStatus('Decentralized Storage', this.state.storageEnabled)}>
          <Storage enabled={this.state.storageEnabled} />
        </Tab>
        <Tab eventKey={3} title={this._renderStatus('P2P communication (Whisper/Orbit)', this.state.whisperEnabled)}>
          <Whisper enabled={this.state.whisperEnabled} />
        </Tab>
      </Tabs>
    </div>);
  }
}

ReactDOM.render(<App></App>, document.getElementById('app'));
