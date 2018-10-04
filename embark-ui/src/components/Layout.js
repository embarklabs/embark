import React from 'react';
import {NavLink} from "react-router-dom";
import {Site, Nav, Button, Container} from "tabler-react";
import PropTypes from 'prop-types';

import logo from '../images/logo.png';

const navBarItems = (tabs) => {
  const homeTab = {value: "Home", to: "/embark", icon: "home", LinkComponent: NavLink};

  const generatedTabs = tabs.map(tab => (
    {LinkComponent: NavLink, ...tab}
  ));

  return [homeTab, ...generatedTabs];
}

const Layout = ({children, logout, credentials, tabs}) => (
  <Site.Wrapper
    headerProps={{
      href: "/embark",
      alt: "Embark",
      imageURL: logo,
      navItems: (
        <React.Fragment>
          <Nav.Item type="div" className="d-none d-md-flex">
            <Button
              href="https://github.com/embark-framework/embark"
              target="_blank"
              outline
              size="sm"
              RootComponent="a"
              color="primary"
            >
              Source code
            </Button>
          </Nav.Item>
          {credentials.authenticated &&
            <Nav.Item type="div" className="d-none d-md-flex">
              Connected on {credentials.host}
            </Nav.Item>
          }
          <Nav.Item type="div" className="d-none d-md-flex">
            <Button
              outline
              onClick={logout}
              size="sm"
              color="danger">
              Logout
            </Button>
          </Nav.Item>
        </React.Fragment>
      )
    }}
    navProps={{itemsObjects: navBarItems(tabs)}}
  >
    <Container>
      {children}
    </Container>
  </Site.Wrapper>
);

Layout.propTypes = {
  children: PropTypes.element,
  tabs: PropTypes.arrayOf(PropTypes.object),
  credentials: PropTypes.object,
  logout: PropTypes.func
};

export default Layout;
