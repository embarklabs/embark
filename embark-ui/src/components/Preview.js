import React from 'react';
import {Button, InputGroup, Input, InputGroupAddon} from 'reactstrap';
import FontAwesome from 'react-fontawesome';

class Preview extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      previewUrl: `${window.location.protocol}//${window.location.host}/`
    };
  }

  handlePreviewUrlChange(ev) {
    this.setState({previewUrl: ev.target.value});
  }

  handlePreviewChange(ev) {
    try {
      let url = ev.target.contentWindow.location.toString();
      this.setState({previewUrl: url});
    } catch(e) {}
  }

  handlePreviewGo() {
    this.previewIframe.src = this.state.previewUrl;
  }

  render() {
    return (
      <div className='h-100 d-flex flex-column'>
        <InputGroup>
          <Input placeholder="URL"
                 value={this.state.previewUrl}
                 onChange={(e) => this.handlePreviewUrlChange(e)}/>
          <InputGroupAddon addonType="append">
            <Button className="ml-auto" color="primary" onClick={(e) => this.handlePreviewGo(e)}>
              <FontAwesome name="refresh"/>
            </Button>
          </InputGroupAddon>
        </InputGroup>
        <iframe width="100%"
                height="100%"
                title="Preview"
                ref={(iframe) => this.previewIframe = iframe}
                onLoad={(e) => this.handlePreviewChange(e)} src={this.state.previewUrl}>
        </iframe>
      </div>
    );
  }
}

export default Preview;

