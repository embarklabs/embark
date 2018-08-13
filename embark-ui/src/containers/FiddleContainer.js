/* eslint multiline-ternary: "off" */
/* eslint operator-linebreak: "off" */
import React, {Component} from 'react';
import {connect} from 'react-redux';
import PropTypes from 'prop-types';
import {fiddle as fiddleAction} from '../actions';
import Fiddle from '../components/Fiddle';
import FiddleResults from '../components/FiddleResults';
import FiddleResultsSummary from '../components/FiddleResultsSummary';
import scrollToComponent from 'react-scroll-to-component';
import {getFiddle} from "../reducers/selectors";
import CompilerError from "../components/CompilerError";

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

  _onCodeChange(newValue) {
    this.setState({value: newValue});
    if (this.compileTimeout) clearTimeout(this.compileTimeout);
    this.compileTimeout = setTimeout(() => {
      this.props.fetchFiddle(newValue);
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
            <CompilerError
              onClick={(e) => { this._onErrorClick(e, annotation); }}
              key={index}
              errorType={errorType}
              row={errorRowCol.row}
              errorMessage={error.formattedMessage}/>,
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
    const {fiddle, loading, error} = this.props;
    let renderings = [];
    let warnings = [];
    let errors = [];
    if (fiddle && fiddle.errors) {
      warnings = this._getFormattedErrors(fiddle.errors, "warning");
      errors = this._getFormattedErrors(fiddle.errors, "error");
    }
    renderings.push(
      <React.Fragment key="fiddle">
        <FiddleResultsSummary
          errors={errors} 
          warnings={warnings} 
          isFetching={loading}
          hasResult={Boolean(fiddle)}
          fatal={error}
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
    if (fiddle || (this.state.value && error)) {
      renderings.push(
        <FiddleResults 
          key="results" 
          errors={errors} 
          warnings={warnings} 
          fatal={error}
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
    fiddle: getFiddle(state), 
    error: state.errorMessage, 
    loading: state.loading
  };
}

FiddleContainer.propTypes = {
  fiddle: PropTypes.object,
  error: PropTypes.string,
  fetchFiddle: PropTypes.func,
  loading: PropTypes.bool
};

export default connect(
  mapStateToProps,
  {
    fetchFiddle: fiddleAction.request
    //fetchBlock: blockAction.request
  },
)(FiddleContainer);
