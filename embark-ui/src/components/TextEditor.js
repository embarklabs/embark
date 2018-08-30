import React from 'react';
import AceEditor from 'react-ace';
import 'brace/mode/javascript';
import 'brace/theme/tomorrow_night_blue';
import 'ace-mode-solidity/build/remix-ide/mode-solidity';
import PropTypes from 'prop-types';

class TextEditor extends React.Component {
  extractRowCol(errorMessage) {
    const errorSplit = errorMessage.split(':');
    if (errorSplit.length >= 3) {
      return {row: errorSplit[1], col: errorSplit[2]};
    }
    return {row: 0, col: 0};
  }

  annotations() {
    const {errors, warnings} = this.props.contractCompile;
    return [].concat(errors).concat(warnings).filter((e) => e).map((e) => {
      const rowCol = this.extractRowCol(e.formattedMessage);
      return Object.assign({}, {
        row: rowCol.row - 1,
        column: rowCol.col - 1,
        text: e.formattedMessage,
        type: e.severity
      });
    });
  }

  render() {
    return (
      <AceEditor
        mode="solidity"
        theme="tomorrow_night_blue"
        name="fiddle"
        height="60em"
        width="100%"
        onChange={this.props.onFileContentChange}
        value={this.props.value}
        showGutter={true}
        annotations={this.annotations()}
        setOptions={{
          useWorker: false
        }}
        editorProps={{
          $blockScrolling: Infinity,
          enableLiveAutocompletion:true,
          highlightSelectedWord: true
        }}
      />
    );
  }
}

TextEditor.propTypes = {
  onFileContentChange: PropTypes.func,
  value: PropTypes.string,
  contractCompile: PropTypes.object
};

export default TextEditor;
