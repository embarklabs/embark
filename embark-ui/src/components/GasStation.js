import PropTypes from "prop-types";
import React, {Component} from 'react';
import {Card, Form, Grid, StampCard, Stamp} from 'tabler-react';
import {CopyToClipboard} from 'react-copy-to-clipboard';

const COLORS = {
  good: 'green',
  medium: 'yellow',
  bad: 'red'
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
    const formattedStats =  gasPrices.filter((gasPrice) => {
      return this.props.gasOracleStats[gasPrice].nbTxs >= 10; // Only keep prices with enough transactions
    }).map(gasPrice => {
      totalWait += this.props.gasOracleStats[gasPrice].totalWait;
      totalTxs += this.props.gasOracleStats[gasPrice].nbTxs;
      totalGasPrice = gasPrice * this.props.gasOracleStats[gasPrice].nbTxs;
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
      return '';
    }
    return <Grid.Row>
      <Grid.Col>
        <Card>
          <Card.Header>
            <Card.Title>Gas Price Estimator</Card.Title>
            <Card.Options>
              <CopyToClipboard text={currentGasStep.gasPrice / this.PRICE_UNIT_DIVIDER}
                               onCopy={() => this.setState({copied: true})}
                               title="Copy gas price to clipboard">
                <span><Stamp color="blue" icon="copy"/></span>
              </CopyToClipboard>
            </Card.Options>
          </Card.Header>

          <Card.Body>
            {this.state.copied && <p>Copied Gas Price</p>}
            <Grid.Row cards={true}>
              <Grid.Col lg={6} md={6} sm={12}>
                <StampCard icon="sliders" color={GasStation.getColorForPrice(currentGasStep.gasPrice)}>
                  {this.getFormattedPrice(currentGasStep.gasPrice)}
                </StampCard>
              </Grid.Col>
              <Grid.Col lg={6} md={6} sm={12}>
                <StampCard icon="clock" color={GasStation.getColorForWait(currentGasStep.wait)}>
                  {this.getFormattedWait(currentGasStep.wait)}
                </StampCard>
              </Grid.Col>
            </Grid.Row>

            <Form.Group>
              <input type="range" className="slider"
                     max={formattedGasOracleStats.length - 1}
                     min={0}
                     step={1}
                     value={this.state.gasOracleSliderIndex}
                     onChange={(e) => this.gasSliderChange(e, 'gasOracleSliderIndex')}
              />
            </Form.Group>

            <Grid.Row cards={true}>
              <Grid.Col lg={4} md={6} sm={12}>
                <StampCard icon="sliders" color="grey">
                  Average Price: {this.getFormattedPrice(this.averagePrice)}
                </StampCard>
              </Grid.Col>
              <Grid.Col lg={4} md={6} sm={12}>
                <StampCard icon="clock" color="grey">
                  Average Wait: {this.getFormattedWait(this.averageWait)}
                </StampCard>
              </Grid.Col>
              <Grid.Col lg={4} md={6} sm={12}>
                <StampCard icon="square" color="grey">
                  Last Block: {this.props.lastBlock.number}
                </StampCard>
              </Grid.Col>
            </Grid.Row>
          </Card.Body>
        </Card>
      </Grid.Col>
    </Grid.Row>;
  }
}

GasStation.propTypes = {
  gasOracleStats: PropTypes.object.isRequired,
  lastBlock: PropTypes.object.isRequired
};

export default GasStation;
