import React from 'react';
import {NavLink} from "react-router-dom";
import {Site, Nav, Button, Container} from "tabler-react";
import PropTypes from 'prop-types';

import logo from '../images/logo.png';

const navBarItems = [
  {value: "Home", to: "/embark", icon: "home", LinkComponent: NavLink},
  {value: "Contracts", to: "/embark/contracts", icon: "box", LinkComponent: NavLink},
  {value: "Explorer", to: "/embark/explorer/accounts", icon: "activity", LinkComponent: NavLink},
  {value: "Fiddle", to: "/embark/fiddle", icon: "codepen", LinkComponent: NavLink},
  {value: "Documentation", to: "/embark/documentation", icon: "file-text", LinkComponent: NavLink}
];

const Layout = ({children, logout}) => (
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
    navProps={{itemsObjects: navBarItems}}
  >
    <Container>
      {children}
    </Container>
  </Site.Wrapper>
);

Layout.propTypes = {
  children: PropTypes.element,
  logout: PropTypes.func
};

export default Layout;
