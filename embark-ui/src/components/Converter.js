import PropTypes from "prop-types";
import React from 'react';
import {Page, Form, Button, Icon} from "tabler-react";
import {CopyToClipboard} from 'react-copy-to-clipboard';

const Converter = (props) => (
  <Page.Content title="Ether Converter">
    <Form.FieldSet>
      {
        props.etherConversions.map(unit => {
          return (
            <Form.Group label={unit.name} key={unit.key}>
              <Form.Input placeholder={unit.name} value={unit.value} onChange={e => props.updateEtherConversions(e.target.value, unit.key)} />
              <CopyToClipboard text={this.state.units[unit.key]} title="Copy value to clipboard">
                <Button color="primary"><Icon name="copy"/></Button>
              </CopyToClipboard>
            </Form.Group>
          )
        })
      }
    </Form.FieldSet>
  </Page.Content>
)

Converter.propTypes = {
  etherConversions: PropTypes.arrayOf(PropTypes.object),
  updateEtherConversions: PropTypes.func
};

export default Converter;
