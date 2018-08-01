import React from 'react';
import { NavLink, withRouter } from "react-router-dom";
import { Site, Nav, Button, Container } from "tabler-react";

import logo from'../images/logo.png';

const navBarItems = [
  { value: "Home", to: "/embark", icon: "home", LinkComponent: withRouter(NavLink) },
  { value: "Contracts", to: "/embark/contracts", icon: "box", LinkComponent: withRouter(NavLink) },
  { value: "Explorer", to: "/embark/explorer/accounts", icon: "activity", LinkComponent: withRouter(NavLink) },
  { value: "Documentation", to: "/embark/documentation", icon: "file-text", LinkComponent: withRouter(NavLink) },
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
    navProps={{ itemsObjects: navBarItems}}
  >
    <Container>
      {props.children}
    </Container>
  </Site.Wrapper>
);

export default Layout;
