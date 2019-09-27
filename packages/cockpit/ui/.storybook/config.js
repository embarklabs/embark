import { addDecorator, configure } from '@storybook/react';
import { withOptions } from '@storybook/addon-options';

const req = require.context("../src/stories", true, /.stories.jsx$/);

function loadStories() {
  req.keys().forEach(filename => req(filename));
}

addDecorator(
  withOptions({
    addonPanelInRight: true,
  })
);

configure(loadStories, module);

import '@coreui/icons/css/coreui-icons.min.css';
import 'font-awesome/css/font-awesome.min.css';
import 'simple-line-icons/css/simple-line-icons.css';
import '@coreui/coreui/dist/css/coreui.min.css';

import '../src/index.css';
