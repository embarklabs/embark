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
      error: null,
      activeKey: 1,
      whisperEnabled: false,
      storageEnabled: false,
      blockchainEnabled: false
    };
  }

  componentDidMount() {
    EmbarkJS.onReady((err) => {
      this.setState({blockchainEnabled: true});
      if (err) {
        // If err is not null then it means something went wrong connecting to ethereum
        // you can use this to ask the user to enable metamask for e.g
        return this.setState({error: err.message || err});
      }

      EmbarkJS.Messages.Providers.whisper.getWhisperVersion((err, _version) => {
        if (err) {
          return console.log(err);
        }
        this.setState({whisperEnabled: true});
      });

      EmbarkJS.Storage.isAvailable().then((result) => {
        this.setState({storageEnabled: result});
      }).catch(() => {
        this.setState({storageEnabled: false});
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
    this.setState({ activeKey: key });
  }

  render() {
    const ensEnabled = EmbarkJS.Names.currentNameSystems && EmbarkJS.Names.isAvailable();
    if (this.state.error) {
      return (<div>
        <div>Something went wrong connecting to ethereum. Please make sure you have a node running or are using metamask to connect to the ethereum network:</div>
        <div>{this.state.error}</div>
      </div>);
    }
    return (<div>
      <h3>Embark - Usage Example</h3>
      <Tabs onSelect={this.handleSelect} activeKey={this.state.activeKey} id="uncontrolled-tab-example">
        <Tab eventKey={1} title={this._renderStatus('Blockchain', this.state.blockchainEnabled)}>
          <Blockchain/>
        </Tab>
        <Tab eventKey={2} title={this._renderStatus('Decentralized Storage', this.state.storageEnabled)}>
          <Storage enabled={this.state.storageEnabled}/>
        </Tab>
        <Tab eventKey={3} title={this._renderStatus('P2P communication (Whisper)', this.state.whisperEnabled)}>
          <Whisper enabled={this.state.whisperEnabled}/>
        </Tab>
        <Tab eventKey={4} title={this._renderStatus('Naming (ENS)', ensEnabled)}>
          <ENS enabled={ensEnabled}/>
        </Tab>
      </Tabs>
    </div>);
  }
}

ReactDOM.render(<App></App>, document.getElementById('app'));
