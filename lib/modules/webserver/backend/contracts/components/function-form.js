import React from 'react';
import CardAlert from './card-alert';
import Function from './function';
import PropTypes from 'prop-types';

class FunctionForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fields: {},
      error: false,
      message: null,
      receipt: null
    };

    this.child = React.createRef();

    this.showResults = this.showResults.bind(this);
    this.handleCopyClick = this.handleCopyClick.bind(this);
  }

  handleCopyClick(e) {
    this.child.current.copyCommand(e);
  }

  _getFunctionParamFields(_elem) {
    if (this.props.abi.type === 'fallback') return '';

    return '(' + this.props.abi.inputs
      .map((input, i) => <input type="text" data-var-type={input.type} data-type="inputParam" data-name={input.name}
                                placeholder={input.name} title={input.type + ' ' + input.name}
                                size={input.name.length}
                                key={'input' + i}/>)
      .join(', ') + ')';
  }

  _getMethodType(_elem) {
    return (this.props.abi.constant === true || this.props.abi.stateMutability === 'view' || this.props.abi.stateMutability === 'pure') ? 'call' : 'send';
  }

  renderContent(receipt, contract) {
    if (receipt === null && (this.state.error || this.state.message === null)) {
      return '';
    }
    let messagesList;
    if (this.props.abi.outputs.filter(x => x.name !== "").length > 0) {
      messagesList = Object.keys(this.state.message).map((key, index) => {
        if (isNaN(key)) {
          return <li key={index}>{key}: {this.state.message[key]}</li>;
        } else {
          return '';
        }
      });
    } else {
      messagesList = Object.keys(this.state.message).map((key, index) => {
        return <li key={index}>{key}: {this.state.message[key]}</li>;
      });
    }

    let message;
    if (this.state.message !== null && typeof this.state.message === 'object') {
      message = <ul>
        {messagesList}
      </ul>;
    } else if (typeof this.state.message === "boolean") {
      message = (this.state.message ? 'true' : 'false');
    } else {
      message = this.state.message;
    }

    return (<div className="card-footer">
      {receipt && <ul>
        <li>Status: {receipt.status}</li>
        <li>Transaction Hash: {receipt.transactionHash}</li>
        {
          receipt.events && <li>Events:
            <ul>
              {
                Object.keys(receipt.events).map(function(ev, index) {
                  if (!isNaN(ev)) return null;
                  const eventAbi = contract.options.jsonInterface.filter(x => x.name === ev)[0];
                  let props = [];
                  for (let prop in receipt.events[ev].returnValues) {
                    if (isNaN(prop)) {
                      let input = eventAbi.inputs.filter(x => x.name === prop)[0];
                      props.push(prop + ': ' +
                        (input.type.indexOf('int') === -1 ? '"' : '') +
                        receipt.events[ev].returnValues[prop] +
                        (input.type.indexOf('int') === -1 ? '"' : ''));
                    }
                  }
                  return <li key={index}>{ev}({props.join(', ')})</li>;
                })
              }
            </ul>
          </li>
        }
      </ul>
      }
      {
        !this.state.error && this.state.message && <React.Fragment>
          {message}
        </React.Fragment>}

    </div>);
  }

  render() {
    const functionName = this.props.abi.name;
    const isDuplicated = this.props.contract.options.jsonInterface.filter(x => x.name === functionName).length > 1;
    const contract = this.props.contract;
    const receipt = this.state.receipt;
    let title;
    if (this.props.abi.type === 'function') {
      title = this.props.abi.name;
    } else if (this.props.abi.type === 'fallback') {
      title = '(fallback)';
    } else {
      title = this.props.abi.name;
    }

    return <div className="card function">

      <div className="card-header">
        <h3
          className="card-title">{title}</h3>
        <div className="card-options">
          <a href="#" onClick={this.handleCopyClick} title="Copy to clipboard"><i className="fe fe-copy"></i></a>
        </div>
      </div>

      <CardAlert show={this.state.error} message={this.state.message}/>

      <div className="card-body row">
        <Function ref={this.child} definition={this.props.definition} contract={this.props.contract}
                  contractName={this.props.contractName} duplicated={isDuplicated} abi={this.props.abi}
                  resultHandler={this.showResults}/>
      </div>
      {this.renderContent(receipt, contract)}
    </div>;
  }

  showResults(_error, _message, _receipt) {
    this.setState({
      error: _error,
      message: _message,
      receipt: _receipt
    });
  }
}

FunctionForm.propTypes = {
  abi: PropTypes.object,
  contract: PropTypes.object,
  definition: PropTypes.object,
  contractName: PropTypes.string
};

export default FunctionForm;
