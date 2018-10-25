import PropTypes from "prop-types";
import React from 'react';
import {
  InputGroup,
  Card,
  CardBody,
  CardHeader,
  Col,
  FormGroup,
  Input,
  Row,
  InputGroupAddon,
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
    const newUnits = calculateUnits(event.target.value, key);
    this.setState({etherConversions: newUnits});
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
                    <InputGroup>
                      <Input id={unit.name} placeholder={unit.name} value={unit.value} onChange={e => this.handleOnChange(e, unit.key)} />
                      <InputGroupAddon addonType="append">
                        <CopyButton text={unit.value} title="Copy value to clipboard" size={2}/>
                      </InputGroupAddon>
                    </InputGroup>
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
