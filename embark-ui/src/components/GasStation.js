import PropTypes from "prop-types";
import React, {Component} from 'react';
import {connect} from 'react-redux';
import {withRouter} from "react-router-dom";
import {Card, Form, Grid, StampCard, Stamp} from 'tabler-react';
import {CopyToClipboard} from 'react-copy-to-clipboard';
import {listenToGasOracle, gasOracle as ethGasAction} from "../actions";
import {getGasStats, getOracleGasStats} from "../reducers/selectors";

const COLORS = {
  good: 'green',
  medium: 'yellow',
  bad: 'red'
};

class GasStation extends Component {
  constructor(props) {
    super(props);

    this.state = {
      gasOracleSliderIndex: 0,
      copied: false
    };
  }

  componentDidMount() {
    this.props.fetchEthGas();
    if (!this.props.gasOracleStats.length) {
      this.props.listenToGasOracle();
    }
  }

  getGasOracleFormatted() {
    const gasPrices = Object.keys(this.props.gasOracleStats);
    if (!gasPrices.length) {
      return [];
    }
    return gasPrices.filter((gasPrice) => {
      return this.props.gasOracleStats[gasPrice].nbTxs >= 10; // Only keep prices with enough transactions
    }).map(gasPrice => {
      return {
        gasPrice,
        wait: this.props.gasOracleStats[gasPrice].averageWait >= 0.1 ? this.props.gasOracleStats[gasPrice].averageWait : 0.1
      };
    }).sort((a, b) => {
      return a.gasPrice - b.gasPrice;
    });
  }

  gasSliderChange(e, name) {
    this.setState({
      [name]: e.target.value
    });
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
              <CopyToClipboard text={currentGasStep.gasPrice / 1000000000}
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
                  {currentGasStep.gasPrice / 1000000000} GWei
                </StampCard>
              </Grid.Col>
              <Grid.Col lg={6} md={6} sm={12}>
                <StampCard icon="clock" color={GasStation.getColorForWait(currentGasStep.wait)}>
                  {currentGasStep.wait} seconds
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

            {/*<Grid.Row cards={true}>
              <Grid.Col lg={4} md={6} sm={12}>
                <StampCard icon="sliders" color="grey">
                  Average Price: {this.formattedGasStats.average.price} GWei
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
            </Grid.Row>*/}
          </Card.Body>
        </Card>
      </Grid.Col>
    </Grid.Row>;
  }
}

GasStation.propTypes = {
  gasOracleStats: PropTypes.object,
  listenToGasOracle: PropTypes.func,
  fetchEthGas: PropTypes.func
};

function mapStateToProps(state, _props) {
  return {
    gasOracleStats: getOracleGasStats(state),
    gasStats: getGasStats(state)
  };
}

export default withRouter(connect(
  mapStateToProps,
  {
    listenToGasOracle: listenToGasOracle,
    fetchEthGas: ethGasAction.request
  }
)(GasStation));
