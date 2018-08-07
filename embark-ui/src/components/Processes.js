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

const Process = ({name, state}) => (
  <Grid.Col sm={6} lg={3}>
    <Card className="p-3">
      <div className="d-flex align-items-center">
        <span className={stampClasses(state)}>
          <i className="fe fa-cube"></i>
        </span>
        <div>
          <h4 className="text-capitalize m-0"><Link to={`/embark/processes/${name}`}>{name}</Link></h4>
        </div>
      </div>
    </Card>
  </Grid.Col>
);

Process.propTypes = {
  name: PropTypes.string,
  state: PropTypes.string
};

const Processes = ({processes}) => (
  <Grid.Row cards>
    {Object.keys(processes).map((name) => <Process key={name} name={name} state={processes[name].state} />)}
  </Grid.Row>
);

Processes.propTypes = {
  processes: PropTypes.object
};

export default Processes;
