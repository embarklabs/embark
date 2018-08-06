import React from 'react';
import AceEditor from 'react-ace';

import 'brace/mode/javascript';

import 'brace/theme/tomorrow_night_blue';
import 'ace-mode-solidity/build/remix-ide/mode-solidity';

const Fiddle = ({code, options, editorDidMount, onChange}) => {
  options = options || {
    selectOnLineNumbers: true
  };
  return (
    <React.Fragment>
      <h1>Fiddle</h1>
      <p>Play around with contract code and deploy against your running node.</p>
      <AceEditor
        mode="solidity"
        theme="tomorrow_night_blue"
        name="blah1"
        height="60em"
        width="100%"
      />
  </React.Fragment>
  );
};


export default Fiddle;
