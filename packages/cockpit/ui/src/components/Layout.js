import React from 'react';
import {NavLink as RNavLink} from 'react-router-dom';
import {Link, withRouter} from 'react-router-dom';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {
  UncontrolledTooltip,
  DropdownItem,
  DropdownMenu,
  DropdownToggle,
  Nav,
  NavItem,
  NavLink,
  Container,
  Alert
} from 'reactstrap';
import {explorerSearch} from "../actions";
import {LIGHT_THEME, DARK_THEME} from '../constants';
import FontAwesome from 'react-fontawesome';

import "./Layout.css";

import {
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
import {searchResult} from "../reducers/selectors";

import SearchBar from './SearchBar';

import logo from '../images/logo-brand-new.png';
import './Layout.css';

const HEADER_NAV_ITEMS = [
  {name: "Dashboard", to: "/", icon: 'tachometer'},
  {name: "Deployment", to: "/deployment", icon: "arrow-up"},
  {name: "Explorer", to: "/explorer/overview", base: "explorer/", icon: "compass"},
  {name: "Editor", to: "/editor", icon: "codepen"},
  {name: "Utils", to: "/utilities/converter", base: "utilities/", icon: "cog"}
];

const SIDEBAR_NAV_ITEMS = {
  "/explorer" : {items: [
    {url: "/explorer/overview", icon: "fa fa-signal", name: "Overview"},
    {url: "/explorer/accounts", icon: "fa fa-users", name: "Accounts"},
    {url: "/explorer/blocks", icon: "fa fa-stop", name: "Blocks"},
    {url: "/explorer/contracts", icon: "fa fa-file-code-o", name: "Contracts"},
    {url: "/explorer/transactions", icon: "fa fa-exchange", name: "Transactions"}
  ]},
  "/utilities/": {items: [
    {url: "/utilities/converter", icon: "fa fa-plug", name: "Converter"},
    {url: "/utilities/communication", icon: "fa fa-phone", name: "Communication"},
    {url: "/utilities/ens", icon: "fa fa-circle", name: "ENS"},
    {url: "/utilities/sign-and-verify", icon: "fa fa-edit", name: "Sign & Verify"},
    {url: "/utilities/transaction-decoder", icon: "fa fa-edit", name: "Transaction Decoder"}
  ]}
};

const removeCssClasses = () => {
  document.body.classList.remove('sidebar-fixed');
  document.body.classList.remove('sidebar-lg-show');
};

const getSidebar = (location) => {
  const currentItem = Object.keys(SIDEBAR_NAV_ITEMS).find(path => location.pathname.startsWith(path));
  return currentItem && SIDEBAR_NAV_ITEMS[currentItem];
};

class Layout extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      searchLoading: false,
      searchError: false
    };
  }

  shouldComponentUpdate(nextProps) {
    if (nextProps.searchResult && Object.keys(nextProps.searchResult).length &&
      nextProps.searchResult !== this.props.searchResult) {
      this.setState({searchLoading: false});

      if (nextProps.searchResult.error) {
        this.setState({searchError: true});
        return true;
      } else {
        this.setState({searchError: false});
      }

      if (nextProps.searchResult.className) {
        this.props.history.push(`/explorer/contracts/${nextProps.searchResult.className}`);
        return false;
      }
      if (nextProps.searchResult.address) {
        this.props.history.push(`/explorer/accounts/${nextProps.searchResult.address}`);
        return false;
      }
      if (nextProps.searchResult.hasOwnProperty('transactionIndex')) {
        this.props.history.push(`/explorer/transactions/${nextProps.searchResult.hash}`);
        return false;
      }
      if (nextProps.searchResult.hasOwnProperty('number')) {
        this.props.history.push(`/explorer/blocks/${nextProps.searchResult.number}`);
        return false;
      }
      // Returned something we didn't know existed
    }
    return true;
  }

  searchTheExplorer(value) {
    this.props.explorerSearch(value);
    this.setState({searchLoading: true});
  }

  dismissSearchError() {
    this.setState({searchError: false});
  }

  isActive = (itemUrl, baseUrl, match, location) => {
    if (itemUrl === location.pathname) {
      return true;
    }
    if (!baseUrl) {
      return false;
    }
    return location.pathname.indexOf(baseUrl) > -1;
  };

  renderNav() {
    return (
      <React.Fragment>
        <Nav className="header-nav d-lg-down-none" navbar>
          {HEADER_NAV_ITEMS.map((item) => {
            return (
              <NavItem className="px-3" key={item.to}>
                <NavLink exact activeClassName="active" tag={RNavLink} to={item.to}
                         isActive={this.isActive.bind(this, item.to, item.base)}>
                  <FontAwesome className="mr-2" name={item.icon}/>
                  {item.name}
                </NavLink>
              </NavItem>
            );
          })}
        </Nav>
        <AppHeaderDropdown className="list-unstyled d-xl-none" direction="down">
          <DropdownToggle nav>
            <FontAwesome name="bars"/>
          </DropdownToggle>
          <DropdownMenu>
            {HEADER_NAV_ITEMS.map((item) => (
              <DropdownItem key={item.to} to={item.to} tag={Link}>
                <FontAwesome className="mr-2" name={item.icon} />
                {item.name}
              </DropdownItem>
            ))}
          </DropdownMenu>
        </AppHeaderDropdown>
      </React.Fragment>
    );
  }

  renderRightNav() {
    return (
      <Nav className="ml-auto" navbar>
        <NavItem>
          <SearchBar loading={this.state.searchLoading} searchSubmit={searchValue => this.searchTheExplorer(searchValue)}/>
        </NavItem>
        {this.renderTool()}
        {this.renderSettings()}
      </Nav>
    );
  }

  renderSettings() {
    const {logout, toggleTheme, currentTheme} = this.props;

    return (
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
    );
  }

  renderTool() {
    return (
      <React.Fragment>
        <NavItem>
          <NavLink id="open-documentation"
                   href="https://framework.embarklabs.io"
                   title="Documentation"
                   rel="noopener noreferrer"
                   target="_blank">
            <FontAwesome name="book" />
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink id="open-github"
                   href="https://github.com/embarklabs"
                   title="Github"
                   rel="noopener noreferrer"
                   target="_blank">
            <FontAwesome name="github" />
          </NavLink>
        </NavItem>
        <UncontrolledTooltip target="open-documentation">
          Open Embark documentation
        </UncontrolledTooltip>
        <UncontrolledTooltip target="open-github">
          Open Github of Embark
        </UncontrolledTooltip>
      </React.Fragment>
    );
  }

  render() {
    const {children, searchResult, location} = this.props;
    const sidebar = getSidebar(location);
    if (!sidebar) {
      removeCssClasses();
    }

    return (
      <div className="app animated fadeIn">
        <AppHeader fixed>
          <AppNavbarBrand full={{src: logo, width: 50, height: 50, alt: 'Embark Logo'}}
                          minimized={{src: logo, width: 50, height: 50, alt: 'Embark Logo'}}
          />
          {this.renderNav()}
          {this.renderRightNav()}
        </AppHeader>

        <div className="app-body">
          {sidebar &&
          <AppSidebar fixed display="sm">
            <AppSidebarHeader />
            <AppSidebarForm />
            <AppSidebarNav navConfig={sidebar} location={location} />
            <AppSidebarFooter />
            <AppSidebarMinimizer />
          </AppSidebar>
          }
          <main className="main">
            <Container fluid className="h-100 pt-4">
              <Alert color="danger" isOpen={(this.state.searchError && Boolean(searchResult.error))}
                     className="search-error no-gutters" toggle={() => this.dismissSearchError()}>
                {searchResult.error}
              </Alert>
              {children}
            </Container>
          </main>
        </div>
      </div>
    );
  }
}

Layout.propTypes = {
  children: PropTypes.element,
  tabs: PropTypes.arrayOf(PropTypes.object),
  location: PropTypes.object,
  logout: PropTypes.func,
  toggleTheme: PropTypes.func,
  currentTheme: PropTypes.string,
  explorerSearch: PropTypes.func,
  searchResult: PropTypes.object,
  history: PropTypes.object
};


function mapStateToProps(state) {
  return {searchResult: searchResult(state)};
}

export default withRouter(connect(
  mapStateToProps,
  {
    explorerSearch: explorerSearch.request
  },
)(Layout));
