import { Component } from 'react';
import SimpleStorage from 'Embark/contracts/SimpleStorage';
window.SimpleStorage = SimpleStorage;

class App extends Component {
  action() {
    console.log("calling...")
    SimpleStorage.methods.get().call(function(err, value) {
      alert(value);
    })
  }

  render() {
    return (
      <div className="App">
        <header className="App-header">
          <h1 className="App-title" onClick={() => this.action() }>Welcome to React</h1>
        </header>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
      </div>
    );
  }
}

export default App;
