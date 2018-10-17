import React from 'react';
import PropTypes from 'prop-types';
import { DropdownItem, DropdownMenu, DropdownToggle, Nav, NavItem, NavLink, Container } from 'reactstrap';
import {LIGHT_THEME, DARK_THEME} from '../constants';
import FontAwesome from 'react-fontawesome';

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

import SearchBar from './SearchBar';

import logo from '../images/logo-new.svg';

const sidebarNavItems = {items: [
  {name: "Dashboard", url: "/embark", icon: 'fa fa-tachometer'},
  {name: "Deployment", url: "/embark/deployment", icon: "fa fa-arrow-up"},
  {name: "Contracts", url: "/embark/contracts", icon: "fa fa-file-text"},
  {name: "Explorer", url: "/embark/explorer", icon: "fa fa-compass", children: [
    {url: "/embark/explorer/overview", icon: "fa fa-signal", name: "Overview"},
    {url: "/embark/explorer/accounts", icon: "fa fa-users", name: "Accounts"},
    {url: "/embark/explorer/blocks", icon: "fa fa-stop", name: "Blocks"},
    {url: "/embark/explorer/transactions", icon: "fa fa-tree", name: "Transactions"}
  ]},
  {name: "Editor", url: "/embark/fiddle", icon: "fa fa-codepen"},
  {name: "Documentation", url: "/embark/documentation", icon: "fa fa-book"},
  {name: "Utils", url: "/embark/utilities/converter", icon: "fa fa-cog", children: [
    {url: "/embark/utilities/converter", icon: "fa fa-plug", name: "Converter"},
    {url: "/embark/utilities/communication", icon: "fa fa-phone", name: "Communication"},
    {url: "/embark/utilities/ens", icon: "fa fa-circle", name: "ENS"},
    {url: "/embark/utilities/sign-and-verify", icon: "fa fa-edit", name: "Sign & Verify"},
    {url: "/embark/utilities/transaction-decoder", icon: "fa fa-edit", name: "Transaction Decoder"}
  ]}
]};

function searchTheExplorer(value) {
  // TODO: search
}

const Layout = ({children, logout, credentials, location, toggleTheme, currentTheme}) => (
  <div className="app animated fadeIn">
    <AppHeader fixed>
      <AppSidebarToggler className="d-lg-none" display="md" mobile />
      <AppNavbarBrand
        full={{ src: logo, width: 50, height: 50, alt: 'Embark Logo' }}
        minimized={{ src: logo, width: 30, height: 30, alt: 'Embark Logo' }}
      />
      <AppSidebarToggler className="d-md-down-none" display="lg" />
      <Nav className="d-md-down-none" navbar>
        {sidebarNavItems.items.map((item) => {
          return (
            <NavItem className="px-3">
              <NavLink href={item.url}>
                <i className={item.icon}>&nbsp;</i>
                {item.name}
              </NavLink>
            </NavItem>
          )
        })}
      </Nav>
      <Nav className="ml-auto" navbar>
        <SearchBar searchSubmit={searchValue => searchTheExplorer(searchValue)}/>
        <AppHeaderDropdown direction="down">
          <DropdownToggle nav>
            <i className="icon-settings" />
          </DropdownToggle>
          <DropdownMenu right style={{ right: 'auto' }}>
            <DropdownItem className="text-capitalize" onClick={() => toggleTheme()}>
              <FontAwesome name={currentTheme === DARK_THEME ? 'sun-o' : 'moon-o'} />
              {currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME} Mode
            </DropdownItem>
            <DropdownItem onClick={logout}><FontAwesome name="lock" /> Logout</DropdownItem>
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
        <Container fluid className="h-100" style={{"margin-top": '24px'}}>
          {children}
        </Container>
      </main>
      <AppAside fixed>
      </AppAside>
    </div>
    <AppFooter>
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
  toggleTheme: PropTypes.func,
  currentTheme: PropTypes.string
};

export default Layout;
