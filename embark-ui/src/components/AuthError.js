import PropTypes from "prop-types";
import React from 'react';
import {Page, Alert, Form, Button} from "tabler-react";

const AuthError = ({error}) => {
  return <Page.Content>
    <Alert type="danger">
      {error}
    </Alert>
    <Form>
      <Form.Input name="token" label="Token" placeholder="Enter Token"/>
      <Button type="submit" color="primary">
        Authorize
      </Button>
    </Form>
  </Page.Content>;
};

AuthError.propTypes = {
  error: PropTypes.string.isRequired
};

export default AuthError;

