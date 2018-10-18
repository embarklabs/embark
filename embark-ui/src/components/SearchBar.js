import React from 'react';
import PropTypes from 'prop-types';
import {Form, FormGroup, Input, Button, Row, Col} from 'reactstrap';
import FontAwesome from 'react-fontawesome';

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
      <Row className={this.props.hidden ? 'hidden' : ''}>
        <Col className="col-sm-12">
          <Form inline className="search-bar float-right my-2">
            <FormGroup>
              <Input type="text" name="search-bar" placeholder="Search by Address / Txhash / Block" onChange={(e) => this.onChange(e)}
                     value={this.state.searchValue} onKeyPress={e => this.onKeyPress(e)} />
              <Button color="secondary" onClick={(e) => this.onSubmit(e)}>
                <FontAwesome name="search"/>
              </Button>
            </FormGroup>
          </Form>
        </Col>
      </Row>
    );
  }
}

SearchBar.propTypes = {
  searchSubmit: PropTypes.func.isRequired,
  hidden: PropTypes.bool
};

export default SearchBar;
