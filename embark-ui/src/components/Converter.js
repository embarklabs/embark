import React, {Component} from 'react';
import {Page, Form, Icon, Button} from "tabler-react";
import Units from 'ethereumjs-units';
import {CopyToClipboard} from 'react-copy-to-clipboard';

const UNITS = [
  { key: 'wei', name: 'Wei' },
  { key: 'kwei', name: 'KWei' },
  { key: 'mwei', name: 'MWei' },
  { key: 'gwei', name: 'Szabo' },
  { key: 'finney', name: 'Finney' },
  { key: 'ether', name: 'Ether' },
  { key: 'kether', name: 'KEther' },
  { key: 'mether', name: 'MEther' },
  { key: 'gether', name: 'GEther' },
  { key: 'tether', namw: 'TEther' }
];

const safeConvert = (value, from, to) => {
  try {
    value = Units.convert(value, from, to);
  } catch (e) {
    value = ''
  }
  return value;
}

const calculateUnits = (value, from) => {
  return UNITS.reduce((acc, unit) => {
    acc[unit.key] = safeConvert(value, from, unit.key)
    return acc;
  }, {});
}

class Converter extends Component {

  constructor(props) {
    super(props);
    const units = calculateUnits('1', 'ether')

    this.state = {
      units
    };
  }

  calculate(value, from) {
    const units = calculateUnits(value, from);
    this.setState({ units })
  }

  render() {
    return (
      <Page.Content title="Ether Converter">
        <Form.FieldSet>
          {
            UNITS.map(unit => {
              return (
                <Form.Group label={unit.name} key={unit.key}>
                  <Form.InputGroup>
                    <Form.Input placeholder={unit.name} value={this.state.units[unit.key]} onChange={e => this.calculate(e.target.value, unit.key)} />

                    <CopyToClipboard text={this.state.units[unit.key]} title="Copy value to clipboard">
                      <Button color="primary"><Icon name="copy"/></Button>
                    </CopyToClipboard>
                  </Form.InputGroup>
                </Form.Group>
              )
            })
          }
        </Form.FieldSet>
      </Page.Content>
    )
  }
}

export default Converter;
