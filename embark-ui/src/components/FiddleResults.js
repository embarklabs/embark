import React, {Component} from 'react';
import {Card, List, Badge} from 'tabler-react';
import PropTypes from 'prop-types';

class FiddleResults extends Component{

  constructor(props){
    super(props);
    this.state = {
      errors: props.compilationResult.errors
    };
  }

  static _removeClass(elems, className){
      for(let elem of elems) {
        elem.className = elem.className.replace(className, '').replace('  ', ' ');
      }
  }

  static _toggleClass(elems, className){
      for(let elem of elems) {
        if(elem.className.indexOf(className) > -1){
          FiddleResults._removeClass([elem], className);
        }
        else{
          elem.className = (elem.className.length > 0 ? elem.className + ' ' : '') + className;
        }
      }
  }

  toggleCollapse(e) {
    const collapsedClassName = 'card-collapsed';
    const className = e.currentTarget.parentElement.className.replace('card-options', '').replace(' ', '');
    const elems = document.getElementsByClassName(className + '-card');
    FiddleResults._toggleClass(elems, collapsedClassName);
  }

  toggleFullscreen(e) {
    const collapsedClassName = 'card-collapsed';
    const fullscreenClassName = 'card-fullscreen';
    const className = e.currentTarget.parentElement.className.replace('card-options', '').replace(' ', '');
    const elems = document.getElementsByClassName(className + '-card');
    FiddleResults._toggleClass(elems, fullscreenClassName);
    FiddleResults._removeClass(elems, collapsedClassName);
  }

  render(){
    const warningObjs = this.props.compilationResult.errors.filter(error => {
      return error.severity === 'warning';
    });
    const errorObjs = this.props.compilationResult.errors.filter(error => {
      return error.severity === 'error';
    });
    const warnings = warningObjs.map((warning, index) => {
      return (
        <List.GroupItem key={index} action>
          <Badge color="warning" className="mr-1" key={index}>
            Lines {warning.sourceLocation.start}-{warning.sourceLocation.end}
          </Badge>
          {warning.formattedMessage}
        </List.GroupItem>
      );
    });
    const errors = errorObjs.map((error, index) => {
      return (
        <List.GroupItem key={index} action>
          <Badge color="danger" className="mr-1" key={index}>
            Lines {error.sourceLocation.start}-{error.sourceLocation.end}
          </Badge>
          {error.formattedMessage}
        </List.GroupItem>
      );
    });
   const errorsCard = <Card
      isCollapsible={true}
      isFullscreenable={true}
      statusColor="red"
      statusSide="true"
      className="errors-card"
      key="errors">
      <Card.Header>
        <Card.Title color="red">Errors <Badge color="danger" className="mr-1">{errors.length}</Badge></Card.Title>
        <Card.Options className="errors">
          <Card.OptionsItem key="0" type="collapse" icon="chevron-up" onClick={this.toggleCollapse}/>
          <Card.OptionsItem key="1" type="fullscreen" icon="maximize" onClick={this.toggleFullscreen}/>
        </Card.Options>
      </Card.Header>
      <Card.Body>
        <List.Group>
          {errors}
        </List.Group>
      </Card.Body>
    </Card>;
    const warningsCard = <Card
      isCollapsible={true}
      isFullscreenable={true}
      statusColor="warning"
      statusSide="true"
      className="warnings-card"
      key="warnings">
      <Card.Header>
        <Card.Title color="warning">Warnings <Badge color="warning" className="mr-1">{warnings.length}</Badge></Card.Title>
        <Card.Options className="warnings">
          <Card.OptionsItem key="0" type="collapse" icon="chevron-up" onClick={this.toggleCollapse}/>
          <Card.OptionsItem key="1" type="fullscreen" icon="maximize" onClick={this.toggleFullscreen}/>
        </Card.Options>
      </Card.Header>
      <Card.Body>
        <List.Group>
          {warnings}
        </List.Group>
      </Card.Body>
    </Card>;

    let renderings = [];
    if(!this.state.errors){
       return 'Compilation successful (add green tick mark)';
    }
    if(errors.length) renderings.push(errorsCard);
    if(warnings.length) renderings.push(warningsCard);
    
    return (
      <React.Fragment>
        {renderings}        
      </React.Fragment>
    );
  }
}

FiddleResults.propTypes = {
  compilationResult: PropTypes.object
};

export default FiddleResults;
