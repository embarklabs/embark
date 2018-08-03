import React, {Component} from 'react';
import {connect} from 'react-redux';
import {fiddleCodeChange} from '../actions';
import Fiddle from '../components/Fiddle';

class FiddleContainer extends Component {
  componentWillMount() {
    //this.props.fetchAccounts();
  }

  render() {
    // const { accounts } = this.props;
    // if (!accounts.data) {
    //   return (
    //     <h1>
    //       <i>Loading accounts...</i>
    //     </h1>
    //   )
    // }

    // if (accounts.error) {
    //   return (
    //     <h1>
    //       <i>Error API...</i>
    //     </h1>
    //   )
    // }
    const options = {
      selectOnLineNumbers: true,
      roundedSelection: false,
      readOnly: false,
      cursorStyle: 'line',
      automaticLayout: false,
    };
    const code = 'hello world';

    return (
      <Fiddle options={options} code={code} />
    );
  }
}
function mapStateToProps(state) {
  return { 
    code: state.code,
    options: state.options
  };
}

export default connect(
  mapStateToProps,
  {
    fiddleCodeChange
  },
)(FiddleContainer);
