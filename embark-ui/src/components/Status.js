import React from 'react';
import {Grid, Card} from 'tabler-react';

const Status = () => (
  <Grid.Row cards>
    <Grid.Col sm={6} lg={3}>
      <Card className="p-3">
        <div className="d-flex align-items-center">
          <span className="stamp stamp-md bg-blue mr-3">
            <i className="fe fa-cube"></i>
          </span>
          <div>
            <h4 className="m-0"><a href="javascript:void(0)">IPFS</a></h4>
            <small className="text-muted">version 2.5</small>
        </div>
        </div>
      </Card>
    </Grid.Col>
    <Grid.Col sm={6} lg={3}>
      <Card className="p-3">
        <div className="d-flex align-items-center">
                  <span className="stamp stamp-md bg-green mr-3">
                    <i className="fe fe-check"></i>
                  </span>
          <div>
            <h4 className="m-0"><a href="javascript:void(0)">Ethereum</a></h4>
            <small className="text-muted">Geth 1.6.7-stable</small>
          </div>
        </div>
      </Card>
    </Grid.Col>
    <Grid.Col sm={6} lg={3}>
      <Card className="p-3">
        <div className="d-flex align-items-center">
                  <span className="stamp stamp-md bg-red mr-3">
                    <i className="fe fe-message-square"></i>
                  </span>
          <div>
            <h4 className="m-0"><a href="javascript:void(0)">Whisper</a></h4>
            <small className="text-muted">V5</small>
          </div>
        </div>
      </Card>
    </Grid.Col>
    <Grid.Col sm={6} lg={3}>
      <Card className="p-3">
        <div className="d-flex align-items-center">
                  <span className="stamp stamp-md bg-yellow mr-3">
                    <i className="fe fe-server"></i>
                  </span>
          <div>
            <h4 className="m-0"><a href="javascript:void(0)">Webserver</a></h4>
            <small className="text-muted">http://localhost:8000</small>
          </div>
        </div>
      </Card>
    </Grid.Col>
  </Grid.Row>
);

export default Status;
