import PropTypes from "prop-types";
import React, {Component} from 'react';
import {Card, CardBody, CardHeader, CardTitle, Row, Col, Input, Badge, Alert} from 'reactstrap';
import CopyButton from './CopyButton';

const COLORS = {
  good: 'success',
  medium: 'warning',
  bad: 'danger'
};

class GasStation extends Component {
  constructor(props) {
    super(props);

    this.PRICE_UNIT_DIVIDER = 1000000000;
    this.WAIT_UNIT = 'sec';
    this.state = {
      gasOracleSliderIndex: 0,
      copied: false
    };
  }

  getGasOracleFormatted() {
    let totalWait = 0;
    let totalTxs = 0;
    let totalGasPrice = 0;
    const gasPrices = Object.keys(this.props.gasOracleStats);
    if (!gasPrices.length) {
      return [];
    }
    const formattedStats = gasPrices.filter((gasPrice) => {
      return this.props.gasOracleStats[gasPrice].nbTxs >= 10; // Only keep prices with enough transactions
    }).map(gasPrice => {
      totalWait += this.props.gasOracleStats[gasPrice].totalWait;
      totalTxs += this.props.gasOracleStats[gasPrice].nbTxs;
      totalGasPrice += gasPrice * this.props.gasOracleStats[gasPrice].nbTxs;
      return {
        gasPrice,
        wait: this.props.gasOracleStats[gasPrice].averageWait >= 0.1 ? this.props.gasOracleStats[gasPrice].averageWait : 0.1
      };
    }).sort((a, b) => {
      return a.gasPrice - b.gasPrice;
    });

    this.averageWait = totalWait / totalTxs;
    this.averagePrice = totalGasPrice / totalTxs;

    return formattedStats;
  }

  getCurrentGas() {
    const formattedGas = this.getGasOracleFormatted();
    if (!formattedGas.length) {
      return -1;
    }
    return this.getGasOracleFormatted()[this.state.gasOracleSliderIndex].gasPrice / this.PRICE_UNIT_DIVIDER;
  }

  gasSliderChange(e, name) {
    this.setState({
      [name]: e.target.value
    });
  }

  getFormattedPrice(price) {
    return (price / this.PRICE_UNIT_DIVIDER).toFixed(3) + ' GWei';
  }

  getFormattedWait(wait) {
    return `${wait.toFixed(3)} ${this.WAIT_UNIT}`;
  }

  static getColorForWait(wait) {
    if (wait <= 60) {
      return COLORS.good;
    }
    if (wait <= 180) {
      return COLORS.medium;
    }
    return COLORS.bad;
  }

  static getColorForPrice(gasPrice) {
    if (gasPrice <= 20000000000) {
      return COLORS.good;
    }
    if (gasPrice <= 40000000000) {
      return COLORS.medium;
    }
    return COLORS.bad;
  }

  render() {
    const formattedGasOracleStats = this.getGasOracleFormatted();
    const currentGasStep = formattedGasOracleStats[this.state.gasOracleSliderIndex];
    if (!formattedGasOracleStats.length) {
      return <Alert color="warning">Currently not enough blocks mined to estimate</Alert>;
    }
    return <Row>
      <Col>
        <Card className="mb-0">
          <CardHeader>
            <CardTitle>
              Gas Price Estimator
              <CopyButton text={currentGasStep.gasPrice / this.PRICE_UNIT_DIVIDER}
                          onCopy={() => this.setState({copied: true})}
                          title="Copy gas price to clipboard"/>
            </CardTitle>
          </CardHeader>

          <CardBody>
            {this.state.copied && <p>Copied Gas Price</p>}
            <Row>
              <Col lg={6} md={6} sm={12}>
                <Badge className="p-2" color={GasStation.getColorForPrice(currentGasStep.gasPrice)}>
                  <i className="mr-2 fa fa-adjust"/>
                  {this.getFormattedPrice(currentGasStep.gasPrice)}
                </Badge>
              </Col>
              <Col lg={6} md={6} sm={12}>
                <Badge className="p-2" color={GasStation.getColorForWait(currentGasStep.wait)}>
                  <i className="mr-2 fa fa-clock-o"/>
                  {this.getFormattedWait(currentGasStep.wait)}
                </Badge>
              </Col>
            </Row>

            <Input type="range" className="slider"
                     max={formattedGasOracleStats.length - 1}
                     min={0}
                     step={1}
                     value={this.state.gasOracleSliderIndex}
                     onChange={(e) => this.gasSliderChange(e, 'gasOracleSliderIndex')}
            />

            <Row>
              <Col lg={4} md={6} sm={12}>
                <Badge className="p-2" color="secondary">
                  <i className="mr-2 fa fa-adjust"/>
                  Average Price: {this.getFormattedPrice(this.averagePrice)}
                </Badge>
              </Col>
              <Col lg={4} md={6} sm={12}>
                <Badge className="p-2" color="secondary">
                  <i className="mr-2 fa fa-clock-o"/>
                  Average Wait: {this.getFormattedWait(this.averageWait)}
                </Badge>
              </Col>
              <Col lg={4} md={6} sm={12}>
                <Badge className="p-2" color="secondary">
                  <i className="mr-2 fa fa-square"/>
                  Last Block: {this.props.lastBlock.number}
                </Badge>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </Col>
    </Row>;
  }
}

GasStation.propTypes = {
  gasOracleStats: PropTypes.object.isRequired,
  lastBlock: PropTypes.object.isRequired
};

export default GasStation;
