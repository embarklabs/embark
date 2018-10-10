import PropTypes from "prop-types";
import React from 'react';
import {
  Button,
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
      <Row className="mt-3 justify-content-md-center">
        <Col xs="12" sm="9" lg="6">
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
                        <CopyToClipboard text={unit.value} title="Copy value to clipboard">
                          <Button color="primary"><i className="fa fa-copy"></i></Button>
                        </CopyToClipboard>
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