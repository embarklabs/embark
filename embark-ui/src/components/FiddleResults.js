/* eslint {jsx-a11y/anchor-has-content:"off"} */
import React, {Component} from 'react';
import {Card, List, Badge, Icon} from 'tabler-react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

class FiddleResults extends Component {

  constructor(props){
    super(props);

    this.state = {
      errorsCollapsed: false,
      warningsCollapsed: false,
      errorsFullscreen: false,
      warningsFullscreen: false
    };
  }

  _toggle(e, type){
    const className = e.currentTarget.parentElement.className.replace('card-options', '').replace(' ', '');
    const updatedState = {};
    updatedState[className + type] = !(this.state[className + type]);
    this.setState(updatedState);
  }

  _getFormatted(errors, errorType){
    const color = (errorType === "error" ? "danger" : errorType);
    const isFullscreen = Boolean(this.state[errorType + 'sFullscreen']);
    const classes = classNames({
      'card-fullscreen': Boolean(this.state[errorType + 'sFullscreen']),
      'card-collapsed': Boolean(this.state[errorType + 'sCollapsed']) && !isFullscreen
    });
    return <Card
      isCollapsible={true}
      isFullscreenable={true}
      statusColor={color}
      statusSide="true"
      className={errorType + "s-card " + classes}
      key={errorType + "s-card"}>
      <Card.Header>
        <Card.Title color={color}>{errorType + "s"} <Badge color={color}>{errors.length}</Badge></Card.Title>
        <Card.Options className={errorType + "s"}>
          <Card.OptionsItem key="0" type="collapse" icon="chevron-up" onClick={(e) => this._toggle(e, 'Collapsed')}/>
          <Card.OptionsItem key="1" type="fullscreen" icon="maximize" onClick={(e) => this._toggle(e, 'Fullscreen')} />
        </Card.Options>
      </Card.Header>
      <Card.Body>
        <List.Group>
          {errors.map(error => { return error.node; })}
        </List.Group>
      </Card.Body>
    </Card>;
  }
  
  render() {
    const {warnings, errors, fatal} = this.props;

    let renderings = [];
    if(fatal){
      renderings.push(
        <React.Fragment key="fatal">
          <a id="fatal" aria-hidden="true"/>
          <Card
            statusColor="danger"
            statusSide="true"
            className="fatal-card"
            key="fatal-card">
            <Card.Header>
              <Card.Title color="danger"><Icon name="slash"/> Failed to compile</Card.Title>
            </Card.Header>
            <Card.Body>
                {fatal}
            </Card.Body>
          </Card>
        </React.Fragment>
      );
    }
    else{
      if (errors.length) renderings.push(
        <React.Fragment key="errors">
          <a id="errors" aria-hidden="true"/>
          {this._getFormatted(errors, "error")}
        </React.Fragment>
      );
      if (warnings.length) renderings.push(
        <React.Fragment key="warnings">
          <a id="warnings" aria-hidden="true"/>
          {this._getFormatted(warnings, "warning")}
        </React.Fragment>
      );
    }

    return (
      <React.Fragment>
        {renderings}
      </React.Fragment>
    );
  }
}

FiddleResults.propTypes = {
  errors: PropTypes.array,
  warnings: PropTypes.array,
  fatal: PropTypes.string
};

export default FiddleResults;
