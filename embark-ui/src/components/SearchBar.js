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

  render() {
    return (
      <Row>
        <Col>
          <Form inline className="search-bar float-right">
            <FormGroup>
              <Input type="text" name="search-bar" placeholder="Search" onChange={(e) => this.onChange(e)}
                     value={this.state.searchValue}/>
              <Button color="secondary" onClick={() => this.props.searchSubmit(this.state.searchValue)}>
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
  searchSubmit: PropTypes.func.isRequired
};

export default SearchBar;
