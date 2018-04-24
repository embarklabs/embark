import EmbarkJS from 'Embark/EmbarkJS';
import React from 'react';
import { Alert, Form, FormGroup, FormControl, HelpBlock, Button } from 'react-bootstrap';
 
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
          logs: []
      };

      this.setText = this.setText.bind(this);
      this.loadHash = this.loadHash.bind(this);
      this.uploadFile = this.uploadFile.bind(this);
      this.handleFileUpload = this.handleFileUpload.bind(this);
      this.loadFile = this.loadFile.bind(this);
    }

    handleChange(e, name){
        this.state[name] = e.target.value;
        this.setState(this.state);
    }

    handleFileUpload(e){
        this.setState({ fileToUpload: [e.target] });
    }

    _addToLog(txt){
        this.state.logs.push(txt);
        this.setState({logs: this.state.logs});
    }

    setText(e){
        e.preventDefault();
        
        let _this = this;

        EmbarkJS.Storage.saveText(this.state.textToSave)
            .then(function(hash) {
                _this.setState({
                    generatedHash: hash,
                    loadText: hash
                });
                _this._addToLog("EmbarkJS.Storage.saveText('" + _this.state.textToSave + "').then(function(hash) { })");
                })
            .catch(function(err) {
                if(err){
                    console.log("Storage saveText Error => " + err.message);
                }
            });
    }

    loadHash(e){
        e.preventDefault();

        let _this = this;

        EmbarkJS.Storage.get(this.state.loadText)
            .then(function(content) {
                _this.setState({storedText: content});
                _this._addToLog("EmbarkJS.Storage.get('" + _this.state.loadText + "').then(function(content) { })");
            })
            .catch(function(err) {
                if(err){
                    console.log("Storage get Error => " + err.message);
                }
            });
    }

    uploadFile(e){
        e.preventDefault();

        let _this = this;

        EmbarkJS.Storage.uploadFile(this.state.fileToUpload)
            .then(function(hash) {
                _this.setState({
                    fileHash: hash,
                    imageToDownload: hash
                });
                _this._addToLog("EmbarkJS.Storage.uploadFile(this.state.fileToUpload).then(function(hash) { })");
                })
            .catch(function(err) {
                if(err){
                    console.log("Storage uploadFile Error => " + err.message);
                }
            });
    }

    loadFile(e){
        let _url = EmbarkJS.Storage.getUrl(this.state.imageToDownload);
        this.setState({url: _url})
        this._addToLog("EmbarkJS.Storage.getUrl('" + this.state.imageToDownload + "')");
    }

    render(){
        return <React.Fragment>
            {
                !this.props.enabled ?
                <React.Fragment>
                <Alert bsStyle="warning">The node you are using does not support IPFS. Please ensure <a href="https://github.com/ipfs/js-ipfs-api#cors" target="_blank">CORS</a> is setup for the IPFS node.</Alert>
                </React.Fragment> : ''
            }

            <h3>Save text to storage</h3>
            <Form inline>
                <FormGroup>
                    <FormControl
                        type="text"
                        defaultValue={this.state.textToSave}
                        onChange={e => this.handleChange(e, 'textToSave')} />
                    <Button bsStyle="primary" onClick={this.setText}>Save Text</Button>
                    <HelpBlock>generated Hash: <span className="textHash">{this.state.generatedHash}</span></HelpBlock>
                </FormGroup>
            </Form> 
            
            <h3>Load text from storage given an hash</h3>
            <Form inline>
                <FormGroup>
                    <FormControl
                        type="text"
                        value={this.state.loadText}
                        onChange={e => this.handleChange(e, 'loadText')} />
                    <Button bsStyle="primary" onClick={this.loadHash}>Load</Button>
                    <HelpBlock>result: <span className="textHash">{this.state.storedText}</span></HelpBlock>
                </FormGroup>
            </Form>

            <h3>Upload file to storage</h3>
            <Form inline>
                <FormGroup>
                    <FormControl
                        type="file"
                        onChange={this.handleFileUpload} />
                    <Button bsStyle="primary" onClick={this.uploadFile}>Upload</Button>
                    <HelpBlock>generated hash: <span className="fileHash">{this.state.fileHash}</span></HelpBlock>
                </FormGroup>
            </Form>
        
            <h3>Get file or image from storage</h3>
            <Form inline>
                <FormGroup>
                    <FormControl
                        type="text"
                        value={this.state.imageToDownload}
                        onChange={e => this.handleChange(e, 'imageToDownload')} />
                    <Button bsStyle="primary" onClick={this.loadFile}>Download</Button>
                    <HelpBlock>file available at: <span><a href={this.state.url} target="_blank">{this.state.url}</a></span></HelpBlock>
                    <HelpBlock><img src={this.state.url} /></HelpBlock>
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