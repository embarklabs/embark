import PropTypes from "prop-types";
import React from 'react';
import './Unauthenticated.css';

class Unauthenticated extends React.Component {
  constructor(props){
    super(props);
    this.state = props.credentials;
  }

  handleChange(event){
    this.setState({[event.target.name]: event.target.value});
  }

  handleSubmit(event) {
    event.preventDefault();
    this.props.authenticate(this.state.host, this.state.token);
  }

  render() {
    return (
      <React.Fragment>
        <h2>Login</h2>
        <div className="login-form">
          <form  onSubmit={(e) => this.handleSubmit(e)}>
            <div className="form-group">
              <label htmlFor="host">Host</label>
              <input type="text"
                    className="form-control form-control-lg"
                    id="host"
                    name="host"
                    placeholder="Enter Embark host"
                    onChange={(e) => this.handleChange(e)}
                    value={this.state.host}/>
            </div>
            <div className="form-group">
              <label htmlFor="token">Token</label>
              <input type="text"
                    className="form-control form-control-lg"
                    id="token"
                    name="token"
                    placeholder="Enter token"
                    onChange={(e) => this.handleChange(e)}
                    value={this.state.token}/>
              <small className="form-text text-muted">Execute <code>embark run</code> in the command line to get your token.</small>
            </div>
            <button type="submit" className="btn btn-pill btn-dark">Enter Cockpit</button>
          </form>
        </div>
      </React.Fragment>
    );
  }
}

Unauthenticated.propTypes = {
  authenticate: PropTypes.func,
  credentials: PropTypes.object,
  error: PropTypes.string
};

export default Unauthenticated;

