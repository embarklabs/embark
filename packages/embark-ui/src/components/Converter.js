import PropTypes from "prop-types";
import React from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  Col,
  FormGroup,
  Input,
  Row,
  Label
} from 'reactstrap';
import CopyButton from './CopyButton';

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
    const value = event.target.value;
    let newUnits;
    if (value.slice(-1) === '.') {
      // `calculateUnits()` turns `1.` to `1` which makes it impossible
      // for users to get beyond the first dot when typing decimal values.
      // That's why we bypass recalculation all together when the last character
      // is a dot and only update the form control in question.
      newUnits = this.state.etherConversions.map(unit => {
        if (unit.key === key) {
          unit.value = value;
        }
        return unit;
      });
      this.setState({etherConversions: newUnits});
    } else {
      newUnits = calculateUnits(value, key);
      this.setState({etherConversions: newUnits});
    }
    const newBaseEther = newUnits.find(unit => unit.key === 'ether');
    this.props.updateBaseEther(newBaseEther.value);
  }

  render() {
    return(
      <Row className="justify-content-md-center">
        <Col xs="12" sm="9" lg="9">
          <Card>
            <CardHeader>
              <strong>Ether Converter</strong>
            </CardHeader>
            <CardBody>
              {
                this.state.etherConversions.map(unit => (
                  <FormGroup key={unit.key}>
                    <Label htmlFor={unit.name}>{unit.name}</Label>
                    <div className="position-relative">
                      <Input id={unit.name} placeholder={unit.name} value={unit.value} onChange={e => this.handleOnChange(e, unit.key)} />
                      <CopyButton text={unit.value} title="Copy value to clipboard" size={2}/>
                    </div>
                  </FormGroup>
                ))
              }
            </CardBody>
          </Card>
        </Col>
      </Row>
    );
  }
}

Converter.propTypes = {
  baseEther: PropTypes.string,
  updateBaseEther: PropTypes.func
};

export default Converter;
