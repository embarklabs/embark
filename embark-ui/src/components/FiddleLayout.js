import React from 'react';
import {
  Page,
  Grid
} from "tabler-react";

import ApplicationPreviewContainer from '../containers/ApplicationPreviewContainer';
import TextEditorContainer from '../containers/TextEditorContainer';
import FileExplorerContainer from '../containers/FileExplorerContainer';

class FiddleLayout extends React.Component {
  render() {
    return (
      <Page.Content title="Fiddle">
        <Grid.Row className="my-5">
          <Grid.Col md={3}>
            <Page.Title>Fiddle</Page.Title>
            <FileExplorerContainer />
          </Grid.Col>
          <Grid.Col md={9}>
            <TextEditorContainer />
          </Grid.Col>
        </Grid.Row>
        <ApplicationPreviewContainer />
      </Page.Content>
    );
  }
}

export default FiddleLayout;
