import React from 'react';
import {Route, Switch} from 'react-router-dom';
import {
  Page,
  Grid
} from "tabler-react";

import FiddleContainer from '../containers/FiddleContainer';
import FileExplorerContainer from '../containers/FileExplorerContainer';

const ExplorerLayout = () => (
  <Grid.Row>
    <Grid.Col md={3}>
      <Page.Title className="my-5">Fiddle</Page.Title>
      <FileExplorerContainer />
    </Grid.Col>
    <Grid.Col md={9}>
      <Switch>
        <Route exact path="/embark/fiddle/" component={FiddleContainer} />
      </Switch>
    </Grid.Col>
  </Grid.Row>
);

export default ExplorerLayout;
