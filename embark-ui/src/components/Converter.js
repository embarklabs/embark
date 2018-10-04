import PropTypes from "prop-types";
import React from 'react';
import {Page, Form, Button, Icon} from "tabler-react";
import {CopyToClipboard} from 'react-copy-to-clipboard';

import { calculateUnits } from '../services/unitConverter';
class Converter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { etherConversions: []};
  }

  componentDidMount() {
    this.setState({etherConversions: calculateUnits(this.props.baseEther, 'Ether')});
  }

  handleOnChange(event, key) {
    const newUnits = calculateUnits(event.target.value, key);
    this.setState({etherConversions: newUnits});
    const newBaseEther = newUnits.find(unit => unit.key === 'ether');
    this.props.updateBaseEther(newBaseEther.value);
  }

  render() {
    return(
      <Page.Content title="Ether Converter">
        <Form.FieldSet>
          {
            this.state.etherConversions.map(unit => {
              return (
                <Form.Group label={unit.name} key={unit.key}>
                  <Form.Input placeholder={unit.name} value={unit.value} onChange={e => this.handleOnChange(e, unit.key)} />
                  <CopyToClipboard text={unit.value} title="Copy value to clipboard">
                    <Button color="primary"><Icon name="copy"/></Button>
                  </CopyToClipboard>
                </Form.Group>
              )
            })
          }
        </Form.FieldSet>
      </Page.Content>
    );
  }
}

Converter.propTypes = {
  baseEther: PropTypes.string,
  updateBaseEther: PropTypes.func
};

export default Converter;