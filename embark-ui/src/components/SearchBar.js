import React from 'react';
import PropTypes from 'prop-types';
import {Form, Input, Button} from 'reactstrap';
import FontAwesome from 'react-fontawesome';
import classNames from 'classnames';

import './SearchBar.css';

class SearchBar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      searchValue: ''
    };
  }

  onChange(e) {
    this.setState({
      searchValue: e.target.value
    });
  }

  onSubmit(e) {
    e.preventDefault();
    this.props.searchSubmit(this.state.searchValue);
  }

  onKeyPress(e) {
    if (e.key === 'Enter') {
      this.onSubmit(e);
    }
  }

  render() {
    return (
      <Form inline className={classNames('search-bar', 'mr-2', {hidden: this.props.hidden})}>
        {!this.props.loading &&
          <React.Fragment>
            <Input type="text" name="search-bar" placeholder="Search by Address / Txhash / Block"
                  onChange={(e) => this.onChange(e)}
                  value={this.state.searchValue} onKeyPress={e => this.onKeyPress(e)}/>
            <Button color="secondary" onClick={(e) => this.onSubmit(e)}>
              <FontAwesome name="search"/>
            </Button>
          </React.Fragment>
        }
        {this.props.loading &&
          <p className="search-loading">Searching... <FontAwesome name="spinner" size="2x" spin className="align-middle ml-2"/></p>
        }
      </Form>
    );
  }
}

SearchBar.propTypes = {
  searchSubmit: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default SearchBar;
