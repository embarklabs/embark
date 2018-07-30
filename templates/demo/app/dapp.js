import React from 'react';
import ReactDOM from 'react-dom';
import {Tabs, Tab} from 'react-bootstrap';

import EmbarkJS from 'Embark/EmbarkJS';
import Blockchain from './components/blockchain';
import Whisper from './components/whisper';
import Storage from './components/storage';
import ENS from './components/ens';

import './dapp.css';

class App extends React.Component {

  constructor(props) {
    super(props);

    this.handleSelect = this.handleSelect.bind(this);

    this.state = {
      activeKey: 1,
      whisperEnabled: false,
      storageEnabled: false,
      ensEnabled: false
    };
  }

  componentDidMount() {
    EmbarkJS.onReady(() => {
      if (EmbarkJS.isNewWeb3()) {
        EmbarkJS.Messages.Providers.whisper.getWhisperVersion((err, _version) => {
          if (err) {
            return console.log(err);
          }
          this.setState({whisperEnabled: true});
        });
      } else {
        if (EmbarkJS.Messages.providerName === 'whisper') {
          EmbarkJS.Messages.getWhisperVersion((err, _version) => {
            if (err) {
              return console.log(err);
            }
            this.setState({whisperEnabled: true});
          });
        }
      }
      this.setState({
        storageEnabled: EmbarkJS.Storage.isAvailable(),
        ensEnabled: EmbarkJS.Names.isAvailable(),
        ensNameSystems: EmbarkJS.Names.currentNameSystems
      });
    });
  }

  _renderStatus(title, available) {
    let className = available ? 'pull-right status-online' : 'pull-right status-offline';
    return <React.Fragment>
      {title}
      <span className={className}></span>
    </React.Fragment>;
  }

  handleSelect(key) {
    if (key === 2) {
      EmbarkJS.Names.setProvider('ipns', {server: 'localhost', port: '5001'});
    } else if (key === 4) {
      EmbarkJS.Names.currentNameSystems = this.state.ensNameSystems
    }
    this.setState({ activeKey: key });
  }

  render() {
    return (<div><h3>Embark - Usage Example</h3>
      <Tabs onSelect={this.handleSelect} activeKey={this.state.activeKey} id="uncontrolled-tab-example">
        <Tab eventKey={1} title="Blockchain">
          <Blockchain/>
        </Tab>
        <Tab eventKey={2} title={this._renderStatus('Decentralized Storage', this.state.storageEnabled)}>
          <Storage enabled={this.state.storageEnabled}/>
        </Tab>
        <Tab eventKey={3} title={this._renderStatus('P2P communication (Whisper)', this.state.whisperEnabled)}>
          <Whisper enabled={this.state.whisperEnabled}/>
        </Tab>
        <Tab eventKey={4} title={this._renderStatus('Naming (ENS)', this.state.ensEnabled)}>
          <ENS enabled={this.state.ensEnabled}/>
        </Tab>
      </Tabs>
    </div>);
  }
}

ReactDOM.render(<App></App>, document.getElementById('app'));
