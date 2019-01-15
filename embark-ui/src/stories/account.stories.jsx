import React from 'react';

import {storiesOf} from '@storybook/react';
import {withKnobs, object} from '@storybook/addon-knobs';
import {withInfo} from "@storybook/addon-info";

import Account from '../components/Account';

const account = {
  address: '0xC257274276a4E539741Ca11b590B9447B26A8051',
  balance: 10.6,
  transactionCount: 20
};

const stories = storiesOf('Account', module);

stories.addDecorator(withKnobs);

stories.add(
  "Default",
  withInfo({inline: true})(() => (
    <Account account={object('account', account)}/>
  ))
);
