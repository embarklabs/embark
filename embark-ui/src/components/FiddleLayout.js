import React from 'react';
import {Row, Col} from 'reactstrap';
import TextEditorAsideContainer from '../containers/TextEditorAsideContainer';
import TextEditorContainer from '../containers/TextEditorContainer';
import FileExplorerContainer from '../containers/FileExplorerContainer';

import './FiddleLayout.css';

const DEFAULT_FILE = {name: 'newContract.sol', content: ''};

class FiddleLayout extends React.Component {
  render() {
    return (
      <Row noGutters className="h-100 fiddle--grid">
        <Col sm={4} md={2}>
          <FileExplorerContainer />
        </Col>
        <Col sm={8} md={6}>
          <TextEditorContainer defaultFile={DEFAULT_FILE} />
        </Col>
        <Col sm={12} md={4}>
          <TextEditorAsideContainer defaultFile={DEFAULT_FILE} />
        </Col>
      </Row>
    );
  }
}

export default FiddleLayout;
