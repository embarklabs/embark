import React from 'react';
import {Route, Switch} from 'react-router-dom';

import ConverterContainer from '../containers/ConverterContainer';

const UtilsLayout = () => (
  <Switch>
    <Route exact path="/embark/utilities/converter" component={ConverterContainer} />
  </Switch>
);

export default UtilsLayout;
