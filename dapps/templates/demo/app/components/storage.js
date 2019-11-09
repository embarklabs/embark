import EmbarkJS from 'Embark/EmbarkJS';
import React, {Fragment} from 'react';
import {Alert, Form, FormGroup, Input, FormText, Button} from 'reactstrap';

class Storage extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      textToSave: 'hello world!',
      generatedHash: '',
      loadText: '',
      storedText: '',
      fileToUpload: null,
      fileHash: '',
      imageToDownload: '',
      url: '',
      logs: [],
      storageError: '',
      valueRegister: '',
      valueResolver: ''
    };
  }

  handleChange(e, name) {
    this.state[name] = e.target.value;
    this.setState(this.state);
  }

  checkEnter(e, func) {
    if (e.key !== 'Enter') {
      return;
    }
    e.preventDefault();
    func.apply(this, [e]);
  }

  handleFileUpload(e) {
    this.setState({fileToUpload: [e.target]});
  }

  addToLog(txt) {
    this.state.logs.push(txt);
    this.setState({logs: this.state.logs});
  }

  setText(e) {
    e.preventDefault();

    EmbarkJS.Storage.saveText(this.state.textToSave)
      .then((hash) => {
        this.setState({
          generatedHash: hash,
          loadText: hash,
          storageError: ''
        });
        this.addToLog("EmbarkJS.Storage.saveText('" + this.state.textToSave + "').then(function(hash) { })");
      })
      .catch((err) => {
        if (err) {
          this.setState({storageError: err.message});
          console.log("Storage saveText Error => " + err.message);
        }
      });
  }

  loadHash(e) {
    e.preventDefault();

    EmbarkJS.Storage.get(this.state.loadText)
      .then((content) => {
        this.setState({storedText: content, storageError: ''});
        this.addToLog("EmbarkJS.Storage.get('" + this.state.loadText + "').then(function(content) { })");
      })
      .catch((err) => {
        if (err) {
          this.setState({storageError: err.message});
          console.log("Storage get Error => " + err.message);
        }
      });
  }

  uploadFile(e) {
    e.preventDefault();

    EmbarkJS.Storage.uploadFile(this.state.fileToUpload)
      .then((hash) => {
        this.setState({
          fileHash: hash,
          imageToDownload: hash,
          storageError: ''
        });
        this.addToLog("EmbarkJS.Storage.uploadFile(this.state.fileToUpload).then(function(hash) { })");
      })
      .catch((err) => {
        if (err) {
          this.setState({storageError: err.message});
          console.log("Storage uploadFile Error => " + err.message);
        }
      });
  }

  loadFile(_e) {
    let _url = EmbarkJS.Storage.getUrl(this.state.imageToDownload);
    this.setState({url: _url});
    this.addToLog("EmbarkJS.Storage.getUrl('" + this.state.imageToDownload + "')");
  }

  ipnsRegister(e) {
    e.preventDefault();
    this.setState({ registering: true, responseRegister: false });
    this.addToLog("EmbarkJS.Storage.register(this.state.ipfsHash).then(function(hash) { })");
    EmbarkJS.Storage.register(this.state.valueRegister, (err, name) => {
      let responseRegister;
      let isRegisterError = false;
      if (err) {
        isRegisterError = true;
        responseRegister = "Name Register Error: " + (err.message || err);
      } else {
        responseRegister = name;
      }

      this.setState({
        registering: false,
        responseRegister,
        isRegisterError
      });
    });
  }

  ipnsResolve(e) {
    e.preventDefault();
    this.setState({ resolving: true, responseResolver: false });
    this.addToLog("EmbarkJS.Storage.resolve(this.state.ipnsName, function(err, path) { })");
    EmbarkJS.Storage.resolve(this.state.valueResolver, (err, path) => {
      let responseResolver;
      let isResolverError = false;
      if (err) {
        isResolverError = true;
        responseResolver = "Name Resolve Error: " + (err.message || err);
      } else {
        responseResolver = path;
      }

      this.setState({
        resolving: false,
        responseResolver,
        isResolverError
      });
    });
  }

  isIpfs(){
    return EmbarkJS.Storage.currentProviderName === 'ipfs';
  }

  render() {
    return <React.Fragment>
      {!this.props.enabled &&
      <React.Fragment>
        <Alert color="warning">The node you are using does not support IPFS. If
          you haven't explicitly disabled IPFS in <code>config/storage.js</code> then
          please ensure <a href="https://github.com/ipfs/js-ipfs-http-client#cors"
          target="_blank">CORS</a> is setup for the IPFS node.</Alert>
      </React.Fragment>}

      {this.state.storageError !== '' &&
      <Alert color="danger">{this.state.storageError}</Alert>}

      <h3>Save text to storage</h3>
      <Form onKeyDown={(e) => this.checkEnter(e, this.setText)}>
        <FormGroup className="inline-input-btn">
          <Input
            type="text"
            defaultValue={this.state.textToSave}
            onChange={e => this.handleChange(e, 'textToSave')}/>
          <Button color="primary" onClick={(e) => this.setText(e)}>Save Text</Button>
          {this.state.generatedHash && <FormText>Generated Hash: <span className="textHash font-weight-bold">{this.state.generatedHash}</span></FormText>}
        </FormGroup>
      </Form>

      <h3>Load text from storage given an hash</h3>
      <Form onKeyDown={(e) => this.checkEnter(e, this.loadHash)}>
        <FormGroup className="inline-input-btn">
          <Input
            type="text"
            value={this.state.loadText}
            onChange={e => this.handleChange(e, 'loadText')}/>
          <Button color="primary" onClick={(e) => this.loadHash(e)}>Load</Button>
          {this.state.storedText && <FormText>Result: <span className="textHash font-weight-bold">{this.state.storedText}</span></FormText>}
        </FormGroup>
      </Form>

      <h3>Upload file to storage</h3>
      <Form>
        <FormGroup>
          <Input
            type="file"
            onChange={(e) => this.handleFileUpload(e)}/>
          <Button color="primary" onClick={(e) => this.uploadFile(e)} className="mt-2">Upload</Button>
          {this.state.fileHash && <FormText>Generated hash: <span className="fileHash">{this.state.fileHash}</span></FormText>}
        </FormGroup>
      </Form>

      <h3>Get file or image from storage</h3>
      <Form onKeyDown={(e) => this.checkEnter(e, this.loadFile)}>
        <FormGroup className="inline-input-btn">
          <Input
            type="text"
            value={this.state.imageToDownload}
            onChange={e => this.handleChange(e, 'imageToDownload')}/>
          <Button color="primary" onClick={(e) => this.loadFile(e)}>Download</Button>
          {this.state.url && <Fragment>
            <FormText>
              File available at: <span><a href={this.state.url} target="_blank">{this.state.url}</a></span>
            </FormText>
            <FormText><img alt="file image" src={this.state.url}/></FormText>
          </Fragment>}
        </FormGroup>
      </Form>

      {!this.isIpfs() && <Alert color="warning">The 2 functions below are only available with IPFS</Alert>}

      <h3>Register to IPNS</h3>
      <Form onKeyDown={(e) => this.checkEnter(e, this.ipnsRegister)}>
        <FormGroup className="inline-input-btn">
          <Input
            type="text"
            value={this.state.valueRegister}
            onChange={e => this.handleChange(e, 'valueRegister')}/>
          <Button color="primary" onClick={(e) => this.ipnsRegister(e)}>
            {this.state.registering ? 'Registering...' : 'Register' }
          </Button>
          <FormText>It will take around 1 minute</FormText>
          {this.state.responseRegister &&
          <Alert className="alert-result" color={this.state.isRegisterError ? 'danger' : 'success'}>
            <span className="value">{this.state.responseRegister}</span>
          </Alert>}
        </FormGroup>
      </Form>

      <h3>Resolve name</h3>
      <Form onKeyDown={(e) => this.checkEnter(e, this.ipnsResolve)}>
        <FormGroup className="inline-input-btn">
          <Input
            type="text"
            value={this.state.valueResolver}
            onChange={e => this.handleChange(e, 'valueResolver')}/>
          <Button color="primary" onClick={(e) => this.ipnsResolve(e)}>
            {this.state.resolving ? 'Resolving...' : 'Resolve' }
          </Button>
          <FormText>It will take around 1 minute</FormText>
          {this.state.responseResolver &&
          <Alert className="alert-result" color={this.state.isResolverError ? 'danger' : 'success'}>
            <span className="value">{this.state.responseResolver}</span>
          </Alert>}
        </FormGroup>
      </Form>


      <p>Javascript calls being made: </p>
      <div className="logs">
        <p>EmbarkJS.Storage.setProvider('ipfs',{'{'}server: 'localhost', port: '5001'{'}'})</p>
        {
          this.state.logs.map((item, i) => <p key={i}>{item}</p>)
        }
      </div>
    </React.Fragment>;
  }
}

export default Storage;
