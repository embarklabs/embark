import React from 'react';
import AceEditor from 'react-ace';
import 'brace/mode/javascript';
import 'brace/theme/tomorrow_night_blue';
import 'ace-mode-solidity/build/remix-ide/mode-solidity';
import PropTypes from 'prop-types';

class Fiddle extends React.Component {
  constructor(props) {
    super(props);

    this.ace = null;
  }

  render() {
    const {onCodeChange, value, errors, warnings} = this.props;
    const annotations = errors.map((error) => { return error.annotation; }).concat(warnings.map(warning => { return warning.annotation; }));
    return (
      <React.Fragment>

        <AceEditor
          mode="solidity"
          theme="tomorrow_night_blue"
          name="fiddle"
          height="60em"
          width="100%"
          onChange={onCodeChange}
          value={value}
          showGutter={true}
          annotations={annotations}
          ref={(ace) => { this.ace = ace; }}
          setOptions={{
            useWorker: false
          }}
          editorProps={{
            $blockScrolling: Infinity,
            enableLiveAutocompletion:true,
            highlightSelectedWord: true
          }}
        />
      </React.Fragment>
    );
  }
}

Fiddle.propTypes = {
  onCodeChange: PropTypes.func,
  value: PropTypes.string,
  errors: PropTypes.array,
  warnings: PropTypes.array
};

export default Fiddle;
