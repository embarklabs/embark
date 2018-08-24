import React from 'react';
import {NavLink} from "react-router-dom";
import {Site, Nav, Button, Container} from "tabler-react";
import PropTypes from 'prop-types';

import logo from '../images/logo.png';

const navBarItems = [
  {value: "Home", to: "/embark", icon: "home", LinkComponent: NavLink},
  {value: "Contracts", to: "/embark/contracts", icon: "box", LinkComponent: NavLink},
  {value: "Explorer", to: "/embark/explorer/accounts", icon: "activity", LinkComponent: NavLink},
  {value: "Processes", to: "/embark/processes", icon: "cpu", LinkComponent: NavLink},
  {value: "Fiddle", to: "/embark/fiddle", icon: "codepen", LinkComponent: NavLink},
  {value: "Documentation", to: "/embark/documentation", icon: "file-text", LinkComponent: NavLink}
];

const Layout = (props) => (
  <Site.Wrapper
    headerProps={{
      href: "/embark",
      alt: "Embark",
      imageURL: logo,
      navItems: (
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
      )
    }}
    navProps={{itemsObjects: navBarItems}}
  >
    <Container>
      {props.children}
    </Container>
  </Site.Wrapper>
);

Layout.propTypes = {
  children: PropTypes.element
};

export default Layout;
