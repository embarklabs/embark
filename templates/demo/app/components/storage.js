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
          logs: [],
          storageError: ''
      };
    }

    handleChange(e, name){
        this.state[name] = e.target.value;
        this.setState(this.state);
    }

    handleFileUpload(e){
        this.setState({ fileToUpload: [e.target] });
    }

    addToLog(txt){
        this.state.logs.push(txt);
        this.setState({logs: this.state.logs});
    }

    setText(e){
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
                if(err){
                    this.setState({storageError: err.message});
                    console.log("Storage saveText Error => " + err.message);
                }
            });
    }

    loadHash(e){
        e.preventDefault();

        EmbarkJS.Storage.get(this.state.loadText)
            .then((content) => {
                this.setState({storedText: content, storageError: ''});
                this.addToLog("EmbarkJS.Storage.get('" + this.state.loadText + "').then(function(content) { })");
            })
            .catch((err) => {
                if(err){
                    this.setState({storageError: err.message})
                    console.log("Storage get Error => " + err.message);
                }
            });
    }

    uploadFile(e){
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
                if(err){
                    this.setState({storageError: err.message});
                    console.log("Storage uploadFile Error => " + err.message);
                }
            });
    }

    loadFile(e){
        let _url = EmbarkJS.Storage.getUrl(this.state.imageToDownload);
        this.setState({url: _url})
        this.addToLog("EmbarkJS.Storage.getUrl('" + this.state.imageToDownload + "')");
    }

    render(){
        return <React.Fragment>
            {
                !this.props.enabled ?
                <React.Fragment>
                <Alert bsStyle="warning">The node you are using does not support IPFS. Please ensure <a href="https://github.com/ipfs/js-ipfs-api#cors" target="_blank">CORS</a> is setup for the IPFS node.</Alert>
                </React.Fragment> : ''
            }
            {
                this.state.storageError !== '' ?
                <Alert bsStyle="danger">{this.state.storageError}</Alert>
                : ''
            }
            <h3>Save text to storage</h3>
            <Form inline>
                <FormGroup>
                    <FormControl
                        type="text"
                        defaultValue={this.state.textToSave}
                        onChange={e => this.handleChange(e, 'textToSave')} />
                    <Button bsStyle="primary" onClick={(e) => this.setText(e)}>Save Text</Button>
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
                    <Button bsStyle="primary" onClick={(e) => this.loadHash(e)}>Load</Button>
                    <HelpBlock>result: <span className="textHash">{this.state.storedText}</span></HelpBlock>
                </FormGroup>
            </Form>

            <h3>Upload file to storage</h3>
            <Form inline>
                <FormGroup>
                    <FormControl
                        type="file"
                        onChange={(e) => this.handleFileUpload(e)} />
                    <Button bsStyle="primary" onClick={(e) => this.uploadFile(e)}>Upload</Button>
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
                    <Button bsStyle="primary" onClick={(e) => this.loadFile(e)}>Download</Button>
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