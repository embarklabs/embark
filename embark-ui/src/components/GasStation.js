import PropTypes from "prop-types";
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withRouter} from "react-router-dom";
import {Card, Form, Grid, StampCard, Stamp} from 'tabler-react';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import {listenToGasOracle} from "../actions";
import {getOracleGasStats} from "../reducers/selectors";

const COLORS = {
  good: 'green',
  medium: 'yellow',
  bad: 'red'
};

class GasStation extends Component {
  constructor(props) {
    super(props);
    if (!props.gasStats) {
      return console.error('gasStats is a needed Prop for GasStation');
    }

    this.state = {
      gasSliderIndex: 0,
      gasOracleSliderIndex: 0,
      copied: false
    };
    this.formattedGasStats = GasStation.formatGasStats(props.gasStats);
  }

  componentDidMount() {
    if (!this.props.gasOracleStats.length) {
      this.props.listenToGasOracle();
    }
  }

  static formatGasStats(gasStats) {
    const {
      fast, speed, fastest, avgWait, fastWait, blockNum, safeLowWait,
      block_time, fastestWait, safeLow, average
    } = gasStats;
    return {
      average: {price: average, wait: avgWait},
      blockTime: block_time,
      blockNum,
      speed,
      gasSteps: [
        {price: safeLow, wait: safeLowWait},
        {price: fast, wait: fastWait},
        {price: fastest, wait: fastestWait}
      ]
    };
  }

  getGasOracleFormatted() {
    const gasPrices = Object.keys(this.props.gasOracleStats);
    if (!gasPrices.length) {
      return [];
    }
    return gasPrices.map(gasPrice => {
      return {
        gasPrice: gasPrice,
        wait: this.props.gasOracleStats[gasPrice].averageWait
      };
    });
  }

  gasSliderChange(e, name) {
    this.setState({
      [name]: e.target.value
    });
  }

  static getColorForWait(wait) {
    if (wait <= 1) {
      return COLORS.good;
    }
    if (wait <= 3) {
      return COLORS.medium;
    }
    return COLORS.bad;
  }

  static getColorForPrice(gasPrice) {
    if (gasPrice <= 20) {
      return COLORS.good;
    }
    if (gasPrice <= 40) {
      return COLORS.medium;
    }
    return COLORS.bad;
  }

  render() {
    const currentGasStep = this.formattedGasStats.gasSteps[this.state.gasSliderIndex];
    const formattedGasOracleStats = this.getGasOracleFormatted();
    return <Grid.Row>
      <Grid.Col>
        <Card>
          <Card.Header>
            <Card.Title>Gas Price Estimator (for Mainnet)</Card.Title>
            <Card.Options>
              <CopyToClipboard text={currentGasStep.price / 10}
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
                <StampCard icon="sliders" color={GasStation.getColorForPrice(currentGasStep.price)}>
                  {currentGasStep.price / 10} GWei
                </StampCard>
              </Grid.Col>
              <Grid.Col lg={6} md={6} sm={12}>
                <StampCard icon="clock" color={GasStation.getColorForWait(currentGasStep.wait)}>
                  {currentGasStep.wait} minutes
                </StampCard>
              </Grid.Col>
            </Grid.Row>

            <Form.Group>
              <input type="range" className="slider"
                     max={this.formattedGasStats.gasSteps.length - 1}
                     min={0}
                     step={1}
                     value={this.state.gasSliderIndex}
                     onChange={(e) => this.gasSliderChange(e, 'gasSliderIndex')}
              />

              {formattedGasOracleStats.length > 0 &&
              <input type="range" className="slider"
                     max={formattedGasOracleStats.length - 1}
                     min={0}
                     step={1}
                     value={this.state.gasOracleSliderIndex}
                     onChange={(e) => this.gasSliderChange(e, 'gasOracleSliderIndex')}
              />}
            </Form.Group>

            <Grid.Row cards={true}>
              <Grid.Col lg={4} md={6} sm={12}>
                <StampCard icon="sliders" color="grey">
                  Average Price: {this.formattedGasStats.average.price / 10} Gwei
                </StampCard>
              </Grid.Col>
              <Grid.Col lg={4} md={6} sm={12}>
                <StampCard icon="clock" color="grey">
                  Average Wait: {this.formattedGasStats.average.wait} min
                </StampCard>
              </Grid.Col>
              <Grid.Col lg={4} md={6} sm={12}>
                <StampCard icon="square" color="grey">
                  Last Block: {this.formattedGasStats.blockNum}
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
  gasStats: PropTypes.object.isRequired,
  gasOracleStats: PropTypes.array,
  listenToGasOracle: PropTypes.func
};

function mapStateToProps(state, _props) {
  return {
    gasOracleStats: getOracleGasStats(state)
  };
}

export default withRouter(connect(
  mapStateToProps,
  {
    listenToGasOracle: listenToGasOracle
  }
)(GasStation));
