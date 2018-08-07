import React from 'react';
import {Grid, Card} from 'tabler-react';

const Console = () => (
  <Grid.Row cards>
    <Grid.Col>
      <Card>
        <Card.Header>
          <Card.Title>Console</Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="log">
            <p>Welcome!</p>
          </div>
          <div className="command-line">
            <div className="form-group">
              <input type="text" className="form-control" name="example-text-input"
                     placeholder="type a command (e.g help)" />
            </div>
          </div>
        </Card.Body>
      </Card>
    </Grid.Col>
  </Grid.Row>
);

export default Console;
