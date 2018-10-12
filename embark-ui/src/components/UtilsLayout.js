import React from 'react';
import {Route, Switch} from 'react-router-dom';

import ConverterContainer from '../containers/ConverterContainer';
import CommunicationContainer from '../containers/CommunicationContainer';
import EnsContainer from '../containers/EnsContainer';

const UtilsLayout = () => (
  <Switch>
    <Route exact path="/embark/utilities/converter" component={ConverterContainer} />
    <Route exact path="/embark/utilities/communication" component={CommunicationContainer} />
    <Route exact path="/embark/utilities/ens" component={EnsContainer} />
  </Switch>
);

export default UtilsLayout;
