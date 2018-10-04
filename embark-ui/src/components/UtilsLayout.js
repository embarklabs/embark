import React from 'react';
import {Page, Grid, List} from 'tabler-react'
import {NavLink, Route, Switch} from 'react-router-dom';

import ConverterContainer from '../containers/ConverterContainer';

const groupItems = [
  {to: "/embark/utilities/converter", icon: "dollar-sign", value: "Ether Converter"}
];

const className = "d-flex align-items-center";

class UtilsLayout extends React.Component {
  render() {
    return (
      <Grid.Row>
        <Grid.Col md={3}>
          <Page.Title className="my-5">Utilities</Page.Title>
          <div>
            <List.Group transparent={true}>
              {groupItems.map((groupItem) => (
                <List.GroupItem
                  key={groupItem.value}
                  className={className}
                  to={groupItem.to}
                  icon={groupItem.icon}
                  RootComponent={NavLink}
                >
                  {groupItem.value}
                </List.GroupItem>
              ))}
            </List.Group>
          </div>
        </Grid.Col>
        <Grid.Col md={9}>
          <Switch>
            <Route exact path="/embark/utilities/converter" component={ConverterContainer} />
          </Switch>
        </Grid.Col>
      </Grid.Row>
    );
  }
}

export default UtilsLayout;
