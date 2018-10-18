import React from 'react';
import PropTypes from 'prop-types';
import {Form, FormGroup, Input, Button, Row, Col} from 'reactstrap';
import FontAwesome from 'react-fontawesome';
import classNames from 'classnames';

import './search.css';

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
      <Form inline className={classNames('search-bar', 'float-right', 'my-2', {hidden: this.props.hidden})}>
        <FormGroup>
          <Input type="text" name="search-bar" placeholder="Search by Address / Txhash / Block"
                 onChange={(e) => this.onChange(e)}
                 value={this.state.searchValue} onKeyPress={e => this.onKeyPress(e)}/>
          <Button color="secondary" onClick={(e) => this.onSubmit(e)}>
            <FontAwesome name="search"/>
          </Button>
        </FormGroup>
      </Form>
    );
  }
}

SearchBar.propTypes = {
  searchSubmit: PropTypes.func.isRequired,
  hidden: PropTypes.bool
};

export default SearchBar;
