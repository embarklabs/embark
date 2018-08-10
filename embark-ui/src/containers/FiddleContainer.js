/* eslint multiline-ternary: "off" */
/* eslint operator-linebreak: "off" */
import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {fetchCodeCompilation} from '../actions';
import Fiddle from '../components/Fiddle';
import FiddleResults from '../components/FiddleResults';
import FiddleReultsSummary from '../components/FiddleResultsSummary';
import {Badge} from 'tabler-react';
import scrollToComponent from 'react-scroll-to-component';

class FiddleContainer extends Component {

  constructor(props) {
    super(props);
    this.state = {
      value: ''
    };
    this.compileTimeout = null;
    this.ace = null;
    this.editor = null;
  }

  componentDidMount() {
    if (this.state.value) {
      this.props.fetchCodeCompilation(this.state.value);
    }
  }

  _onCodeChange(newValue) {
    this.setState({value: newValue});
    if (this.compileTimeout) clearTimeout(this.compileTimeout);
    this.compileTimeout = setTimeout(() => {
      this.props.fetchCodeCompilation(newValue);
    }, 1000);

  }

  _getFormattedErrors(errors, errorType){
    return errors.reduce(
      (errors, error, index) => {
        if (error.severity === errorType) {
          const errorRowCol = this._getRowCol(error.formattedMessage);
          const annotation = Object.assign({}, {
            row: errorRowCol.row - 1, // must be 0 based
            column: errorRowCol.col - 1,  // must be 0 based
            text: error.formattedMessage,  // text to show in tooltip
            type: error.severity // "error"|"warning"|"info"
          });
          errors.push({
            solcError: error,
            node: 
              <a 
                href="#editor"
                className="list-group-item list-group-item-action" 
                onClick={(e) => { this._onErrorClick(e, annotation); }}
                key={index} 
                >
                <Badge color={errorType === "error" ? "danger" : errorType} className="mr-1" key={index}>
                  Line {errorRowCol.row}
                </Badge>
                {error.formattedMessage}
              </a>,
            annotation: annotation
          });
        }
        return errors;
      }, []);
  }

  _getRowCol(errorMessage){
    const errorSplit = errorMessage.split(':');
    if(errorSplit.length >= 3){
      return {row: errorSplit[1], col: errorSplit[2]};
    }
    return {row: 0, col: 0};
  }

  _onErrorClick(e, annotation){
    e.preventDefault();
    this.editor.gotoLine(annotation.row + 1);
    scrollToComponent(this.ace);
  }

  render() {
    const {fiddles} = this.props;
    let renderings = [];
    let warnings = [];
    let errors = [];
    if (fiddles.compilationResult) {
      warnings = this._getFormattedErrors(fiddles.compilationResult.errors, "warning");
      errors = this._getFormattedErrors(fiddles.compilationResult.errors, "error");
      
    }
    renderings.push(
      <React.Fragment key="fiddle">
        <FiddleReultsSummary
          errors={errors} 
          warnings={warnings} 
          isFetching={fiddles.isFetching}
          hasResult={Boolean(fiddles.compilationResult)}
        />
        <Fiddle
          value={this.state.value} 
          onCodeChange={(n) => this._onCodeChange(n)} 
          errors={errors} 
          warnings={warnings}
          ref={(fiddle) => { 
            if(fiddle) {
              this.editor = fiddle.ace.editor; 
              this.ace = fiddle.ace;
            }
          }} 
        />
      </React.Fragment>
    );
    if (fiddles.compilationResult) {
      renderings.push(
        <FiddleResults 
          key="results" 
          errors={errors} 
          warnings={warnings} 
        />);
    }

    return (
      <React.Fragment>
        <h1 className="page-title">Fiddle</h1>
        <p>Play around with contract code and deploy against your running node.</p>
        {renderings}
      </React.Fragment>
    );
  }
}
function mapStateToProps(state) {
  return {
    fiddles: state.fiddles
  };
}

FiddleContainer.propTypes = {
  fiddles: PropTypes.object,
  fetchCodeCompilation: PropTypes.func
};

export default connect(
  mapStateToProps,
  {
    fetchCodeCompilation
  },
)(FiddleContainer);
