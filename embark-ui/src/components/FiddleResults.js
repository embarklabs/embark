/* eslint {jsx-a11y/anchor-has-content:"off"} */
import React, {Component} from 'react';
import {Card, List, Badge} from 'tabler-react';
import PropTypes from 'prop-types';

class FiddleResults extends Component {

  static _removeClass(elems, className) {
    for (let elem of elems) {
      elem.className = elem.className.replace(className, '').replace('  ', ' ');
    }
  }

  static _toggleClass(elems, className) {
    for (let elem of elems) {
      if (elem.className.indexOf(className) > -1) {
        FiddleResults._removeClass([elem], className);
      }
      else {
        elem.className = (elem.className.length > 0 ? elem.className + ' ' : '') + className;
      }
    }
  }

  _toggleCollapse(e) {
    const collapsedClassName = 'card-collapsed';
    const className = e.currentTarget.parentElement.className.replace('card-options', '').replace(' ', '');
    const elems = document.getElementsByClassName(className + '-card');
    FiddleResults._toggleClass(elems, collapsedClassName);
  }
  
  _toggleFullscreen(e) {
    const collapsedClassName = 'card-collapsed';
    const fullscreenClassName = 'card-fullscreen';
    const className = e.currentTarget.parentElement.className.replace('card-options', '').replace(' ', '');
    const elems = document.getElementsByClassName(className + '-card');
    FiddleResults._toggleClass(elems, fullscreenClassName);
    FiddleResults._removeClass(elems, collapsedClassName);
  }

  _getFormatted(errors, errorType){
    const color = (errorType === "error" ? "danger" : errorType);
    return <Card
      isCollapsible={true}
      isFullscreenable={true}
      statusColor={color}
      statusSide="true"
      className={errorType + "s-card"}
      key={errorType + "s-card"}>
      <Card.Header>
        <Card.Title color={color}>{errorType + "s"} <Badge color={color}>{errors.length}</Badge></Card.Title>
        <Card.Options className={errorType + "s"}>
          <Card.OptionsItem key="0" type="collapse" icon="chevron-up" onClick={this._toggleCollapse} />
          <Card.OptionsItem key="1" type="fullscreen" icon="maximize" onClick={this._toggleFullscreen} />
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
    const {warnings, errors} = this.props;

    let renderings = [];
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

    return (
      <React.Fragment>
        {renderings}
      </React.Fragment>
    );
  }
}

FiddleResults.propTypes = {
  errors: PropTypes.array,
  warnings: PropTypes.array
};

export default FiddleResults;
