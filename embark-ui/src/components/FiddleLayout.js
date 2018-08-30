import React from 'react';
import {
  Page,
  Grid
} from "tabler-react";

import TextEditorContainer from '../containers/TextEditorContainer';
import FileExplorerContainer from '../containers/FileExplorerContainer';

class FiddleLayout extends React.Component {
  render() {
    return (
      <Grid.Row className="my-5">
        <Grid.Col md={3}>
          <Page.Title>Fiddle</Page.Title>
          <FileExplorerContainer />
        </Grid.Col>
        <Grid.Col md={9}>
          <TextEditorContainer />
        </Grid.Col>
      </Grid.Row>
    );
  }
}

export default FiddleLayout;
