import React from 'react';
import PropTypes from 'prop-types';
import {Form, Input, Button} from 'reactstrap';
import FontAwesome from 'react-fontawesome';
import classNames from 'classnames';


class SearchBar extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      searchValue: '',
      showForm: false
    };
  }

  onChange(e) {
    this.setState({
      searchValue: e.target.value
    });
  }

  onSubmit(e) {
    e.preventDefault();
    this.hideForm();
    this.props.searchSubmit(this.state.searchValue);
  }

  hideForm() {
    this.setState({showForm: false});
  }

  onKeyPress(e) {
    if (e.key === 'Enter') {
      this.onSubmit(e);
    }
  }

  revealForm() {
    this.setState({showForm: true});
  }

  render() {
    return (
      <Form inline className={classNames('search-bar', 'mr-2')}>
        {!this.props.loading &&
          <React.Fragment>
            <div className={classNames({'d-sm-down-none': !this.state.showForm})}>
              <Input type="text" name="search-bar"
                    placeholder="Search by Address / Txhash / Block"
                    onChange={(e) => this.onChange(e)}
                    value={this.state.searchValue}
                    onBlur={() => this.hideForm()}
                    onKeyPress={e => this.onKeyPress(e)}/>
              <Button className="search-bar__button" color="secondary" onClick={(e) => this.onSubmit(e)}>
                <FontAwesome name="search"/>
              </Button>
            </div>
            {!this.state.showForm && <div className="d-block d-md-none">
              <Button color="secondary" onClick={() => this.revealForm()}>
                <FontAwesome name="search"/>
              </Button>
            </div>}
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
