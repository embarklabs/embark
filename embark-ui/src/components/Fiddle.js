import React from 'react';
import MonacoEditor from 'react-monaco-editor';

const Fiddle = ({code, options, editorDidMount, onChange}) => {
  options = options || {
    selectOnLineNumbers: true
  };
  return (
    <React.Fragment>
      <h1>Fiddle</h1>
      <p>Play around with contract code and deploy against your running node.</p>
      <MonacoEditor
        height="1200"
        language="sol"
        theme="vs-dark"
        value={code}
        options={options}
        onChange={onChange}
        editorDidMount={editorDidMount}
/>
  </React.Fragment>
  );
};


export default Fiddle;
