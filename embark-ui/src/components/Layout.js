import React from 'react';
import PropTypes from 'prop-types';
import { UncontrolledDropdown, DropdownItem, DropdownMenu, DropdownToggle, Nav, Container } from 'reactstrap';

import {
  AppAside,
  AppFooter,
  AppHeader,
  AppSidebar,
  AppSidebarFooter,
  AppSidebarForm,
  AppSidebarHeader,
  AppSidebarMinimizer,
  AppSidebarNav,
  AppSidebarToggler,
  AppNavbarBrand,
  AppHeaderDropdown
} from '@coreui/react';

import logo from '../images/logo.png';

const sidebarNavItems = {items: [
  {name: "Dashboard", url: "/embark", icon: 'fa fa-tachometer'},
  {name: "Deployment", url: "/embark/deployment", icon: "fa fa-arrow-up"},
  {name: "Contracts", url: "/embark/contracts", icon: "fa fa-file-text"},
  {name: "Explorer", url: "/embark/explorer", icon: "fa fa-compass", children: [
    {url: "/embark/explorer/overview", icon: "fa fa-signal", name: "Overview"},
    {url: "/embark/explorer/accounts", icon: "fa fa-users", name: "Accounts"},
    {url: "/embark/explorer/blocks", icon: "fa fa-stop", name: "Blocks"},
    {url: "/embark/explorer/transactions", icon: "fa fa-tree", name: "Transactions"},
  ]},
  {name: "Fiddle", url: "/embark/fiddle", icon: "fa fa-codepen"},
  {name: "Documentation", url: "/embark/documentation", icon: "fa fa-book"},
  {name: "Utils", url: "/embark/utilities/converter", icon: "fa fa-cog", children: [
    {url: "/embark/utilities/converter", icon: "fa fa-plug", name: "Converter"},
    {url: "/embark/utilities/communication", icon: "fa fa-phone", name: "Communication"},
    {url: "/embark/utilities/ens", icon: "fa fa-circle", name: "ENS"}
  ]},
]};

const Layout = ({children, logout, credentials, location, changeTheme}) => (
  <div className="app">
    <AppHeader fixed>
      <AppSidebarToggler className="d-lg-none" display="md" mobile />
      <AppNavbarBrand
        full={{ src: logo, width: 50, height: 50, alt: 'Embark Logo' }}
        minimized={{ src: logo, width: 30, height: 30, alt: 'Embark Logo' }}
      />
      <AppSidebarToggler className="d-md-down-none" display="lg" />
      <Nav className="ml-auto" navbar>
        <AppHeaderDropdown direction="down">
          <DropdownToggle nav>
            <i className="fa fa-user fa-3x" />
          </DropdownToggle>
          <DropdownMenu right style={{ right: 'auto' }}>
            <DropdownItem onClick={logout}><i className="fa fa-lock"></i> Logout</DropdownItem>
          </DropdownMenu>
        </AppHeaderDropdown>
      </Nav>
    </AppHeader>
    <div className="app-body">
      <AppSidebar fixed display="lg">
        <AppSidebarHeader />
        <AppSidebarForm />
        <AppSidebarNav navConfig={sidebarNavItems} location={location} />
        <AppSidebarFooter />
        <AppSidebarMinimizer />
      </AppSidebar>
      <main className="main">
        <Container fluid className="h-100">
          {children}
        </Container>
      </main>
      <AppAside fixed>
      </AppAside>
    </div>
    <AppFooter>
      <UncontrolledDropdown direction="up">
        <DropdownToggle caret>
          Theme
        </DropdownToggle>
        <DropdownMenu>
          <DropdownItem onClick={() => changeTheme('dark')}>Dark</DropdownItem>
          <DropdownItem onClick={() => changeTheme('light')}>Light</DropdownItem>
        </DropdownMenu>
      </UncontrolledDropdown>

      <span className="ml-auto">
        Embark&nbsp;
        <a href="https://embark.status.im" title="Documentation" rel="noopener noreferrer" target="_blank">Documentation</a>
        &nbsp;|&nbsp;
        <a href="https://github.com/embark-framework" title="Github" rel="noopener noreferrer" target="_blank">Github</a>
      </span>
    </AppFooter>
  </div>
);

Layout.propTypes = {
  children: PropTypes.element,
  tabs: PropTypes.arrayOf(PropTypes.object),
  credentials: PropTypes.object,
  location: PropTypes.object,
  logout: PropTypes.func,
  changeTheme: PropTypes.func
};

export default Layout;
