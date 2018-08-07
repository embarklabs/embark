import PropTypes from "prop-types";
import React from 'react';
import {Link} from "react-router-dom";
import {Grid, Card} from 'tabler-react';
import classNames from 'classnames';

function stampClasses(state){
  return classNames('stamp stamp-md mr-3', {
    'bg-green': state === 'running',
    'bg-danger': state !== 'running'
  });
}

const Process = ({process}) => (
  <Grid.Col sm={6} lg={3}>
    <Card className="p-3">
      <div className="d-flex align-items-center">
        <span className={stampClasses(process.state)}>
          <i className="fe fa-cube"></i>
        </span>
        <div>
          <h4 className="text-capitalize m-0"><Link to={`/embark/processes/${process.name}`}>{process.name}</Link></h4>
        </div>
      </div>
    </Card>
  </Grid.Col>
);

Process.propTypes = {
  process: PropTypes.object
};

const Processes = ({processes}) => (
  <Grid.Row cards>
    {processes.map((process) => <Process key={process.name} process={process} />)}
  </Grid.Row>
);

Processes.propTypes = {
  processes: PropTypes.arrayOf(PropTypes.object)
};

export default Processes;
