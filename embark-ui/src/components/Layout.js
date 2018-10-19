import React from 'react';
import {Link} from 'react-router-dom';
import PropTypes from 'prop-types';
import {DropdownItem, DropdownMenu, DropdownToggle, Nav, NavItem, NavLink, Container} from 'reactstrap';
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
  AppNavbarBrand,
  AppHeaderDropdown
} from '@coreui/react';

import SearchBar from './SearchBar';

import logo from '../images/logo-new.svg';

const HEADER_NAV_ITEMS = [
  {name: "Dashboard", to: "/embark", icon: 'tachometer'},
  {name: "Deployment", to: "/embark/deployment", icon: "arrow-up"},
  {name: "Contracts", to: "/embark/contracts", icon: "file-text"},
  {name: "Explorer", to: "/embark/explorer/overview", icon: "compass"},
  {name: "Editor", to: "/embark/editor", icon: "codepen"},
  {name: "Utils", to: "/embark/utilities/converter", icon: "cog"}
];

const SIDEBAR_NAV_ITEMS = {
  "/embark/explorer" : {items: [
    {url: "/embark/explorer/overview", icon: "fa fa-signal", name: "Overview"},
    {url: "/embark/explorer/accounts", icon: "fa fa-users", name: "Accounts"},
    {url: "/embark/explorer/blocks", icon: "fa fa-stop", name: "Blocks"},
    {url: "/embark/explorer/transactions", icon: "fa fa-tree", name: "Transactions"}
  ]},
  "/embark/utilities/": {items: [
    {url: "/embark/utilities/converter", icon: "fa fa-plug", name: "Converter"},
    {url: "/embark/utilities/communication", icon: "fa fa-phone", name: "Communication"},
    {url: "/embark/utilities/ens", icon: "fa fa-circle", name: "ENS"},
    {url: "/embark/utilities/sign-and-verify", icon: "fa fa-edit", name: "Sign & Verify"},
    {url: "/embark/utilities/transaction-decoder", icon: "fa fa-edit", name: "Transaction Decoder"}
  ]}
};

const removeCssClasses = () => {
  document.body.classList.remove('sidebar-fixed');
  document.body.classList.remove('sidebar-lg-show');
}

const getSidebar = (location) => {
  const currentItem = Object.keys(SIDEBAR_NAV_ITEMS).find(path => location.pathname.startsWith(path));
  return currentItem && SIDEBAR_NAV_ITEMS[currentItem];
}

function searchTheExplorer(value) {
  // TODO: search
}

const Layout = ({children, logout, location, toggleTheme, currentTheme}) => {
  const sidebar = getSidebar(location);
  if (!sidebar) {
    removeCssClasses();
  }
  return (
    <div className="app animated fadeIn">
      <AppHeader fixed>
        <AppNavbarBrand className="mx-3"
          full={{ src: logo, width: 50, height: 50, alt: 'Embark Logo' }}
          minimized={{ src: logo, width: 30, height: 30, alt: 'Embark Logo' }}
        />
        <Nav className="d-md-down-none" navbar>
          {HEADER_NAV_ITEMS.map((item) => {
            return (
              <NavItem className="px-3" key={item.to}>
                <NavLink exact tag={Link} to={item.to}>
                  <FontAwesome className="mr-2" name={item.icon} />
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
        {sidebar &&
          <AppSidebar fixed display="lg">
            <AppSidebarHeader />
            <AppSidebarForm />
            <AppSidebarNav navConfig={sidebar} location={location} />
            <AppSidebarFooter />
            <AppSidebarMinimizer />
          </AppSidebar>
        }
        <main className="main">
          <Container fluid className="h-100" style={{marginTop: '24px'}}>
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
}

Layout.propTypes = {
  children: PropTypes.element,
  tabs: PropTypes.arrayOf(PropTypes.object),
  location: PropTypes.object,
  logout: PropTypes.func,
  toggleTheme: PropTypes.func,
  currentTheme: PropTypes.string
};

export default Layout;
