import PropTypes from "prop-types";
import React from 'react';
import {Link} from "react-router-dom";
import {Grid, Card} from 'tabler-react';

const Version = ({version}) => (
  <Grid.Col sm={6} lg={3}>
    <Card className="p-3">
      <div className="d-flex align-items-center">
        <span className="stamp stamp-md mr-3 bg-info">
          <i className="fe fa-cube"></i>
        </span>
        <div>
          <h4 className="text-capitalize m-0">{version.name}: {version.value}</h4>
        </div>
      </div>
    </Card>
  </Grid.Col>
);

Version.propTypes = {
  version: PropTypes.object
};

const Versions = ({versions}) => (
  <Grid.Row cards>
    {versions.map((version) => <Version key={version.name} version={version} />)}
  </Grid.Row>
);

Versions.propTypes = {
  versions: PropTypes.arrayOf(PropTypes.object)
};

export default Versions;
