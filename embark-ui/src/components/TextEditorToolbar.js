import React from 'react';
import PropTypes from 'prop-types';
import {Grid, Button} from 'tabler-react';

const TextEditorToolbar = (props) => (
  <Grid.Col md={6}>
    <strong>{props.currentFile.name}</strong>
    <span className="mx-2">|</span>
    <Button color="green" size="sm" icon="save" onClick={props.save}>Save</Button>
    <span className="mx-2">|</span>
    <Button color="red" size="sm" icon="delete" onClick={props.remove}>Delete</Button>
  </Grid.Col>
);

TextEditorToolbar.propTypes = {
  currentFile: PropTypes.object,
  save: PropTypes.func,
  remove: PropTypes.func
};

export default TextEditorToolbar;
