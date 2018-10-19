import React from 'react';
import {Link, withRouter} from 'react-router-dom';
import PropTypes from 'prop-types';
import {connect} from 'react-redux';
import {DropdownItem, DropdownMenu, DropdownToggle, Nav, NavItem, NavLink, Container, Alert} from 'reactstrap';
import {explorerSearch} from "../actions";
import {LIGHT_THEME, DARK_THEME} from '../constants';
import FontAwesome from 'react-fontawesome';

import {
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
import {searchResult} from "../reducers/selectors";

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
      }

      if (nextProps.searchResult.className) {
        this.props.history.push(`/embark/contracts/${nextProps.searchResult.className}/overview`);
        return false;
      }
      if (nextProps.searchResult.address) {
        this.props.history.push(`/embark/explorer/accounts/${nextProps.searchResult.address}`);
        return false;
      }
      if (nextProps.searchResult.hasOwnProperty('transactionIndex')) {
        this.props.history.push(`/embark/explorer/transactions/${nextProps.searchResult.hash}`);
        return false;
      }
      if (nextProps.searchResult.hasOwnProperty('number')) {
        this.props.history.push(`/embark/explorer/blocks/${nextProps.searchResult.number}`);
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

  closeSearchError() {
    this.setState({searchError: false});
  }

  renderNav() {
    return (<Nav className="d-md-down-none" navbar>
      {HEADER_NAV_ITEMS.map((item) => {
        return (
          <NavItem className="px-3" key={item.to}>
            <NavLink exact tag={Link} to={item.to}>
              <FontAwesome className="mr-2" name={item.icon} />
              {item.name}
            </NavLink>
          </NavItem>
        );
      })}
    </Nav>);
  }

  renderRightNav() {
    return (<Nav className="ml-auto" navbar>
      {<SearchBar hidden={this.state.searchLoading} searchSubmit={searchValue => this.searchTheExplorer(searchValue)}/>}
      {this.state.searchLoading && <p className="search-loading">
        Searching... <FontAwesome name="spinner" size="2x" spin className="align-middle ml-2"/>
      </p>}

      {this.renderSettings()}
    </Nav>);
  }

  renderSettings() {
    const {logout, toggleTheme, currentTheme} = this.props;

    return (<AppHeaderDropdown direction="down">
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
    </AppHeaderDropdown>);
  }

  renderFooter() {
    return (<AppFooter>
        <span className="ml-auto">
          Embark&nbsp;
          <a href="https://embark.status.im" title="Documentation" rel="noopener noreferrer" target="_blank">Documentation</a>
          &nbsp;|&nbsp;
          <a href="https://github.com/embark-framework" title="Github" rel="noopener noreferrer" target="_blank">Github</a>
        </span>
    </AppFooter>);
  }

  render() {
    const {children, searchResult, location} = this.props;
    const sidebar = getSidebar(location);
    if (!sidebar) {
      removeCssClasses();
    }

    return (<div className="app animated fadeIn">
      <AppHeader fixed>
        <AppNavbarBrand className="mx-3"
                        full={{src: logo, width: 50, height: 50, alt: 'Embark Logo'}}
                        minimized={{src: logo, width: 30, height: 30, alt: 'Embark Logo'}}
        />

        {this.renderNav()}

        {this.renderRightNav()}
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
          {searchResult.error && this.state.searchError && <Alert color="danger">{searchResult.error}
            <span className="search-error-close" onClick={(e) => this.closeSearchError(e)}>
              <FontAwesome name="times-circle"/>
            </span>
          </Alert>}

          <Container fluid className="h-100" style={{marginTop: '24px'}}>
            {children}
          </Container>
        </main>
      </div>

      {this.renderFooter()}
    </div>);
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
