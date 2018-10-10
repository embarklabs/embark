import React from 'react';
import logo from '../images/logo.png';
import './LoginLayout.css';

const LoginLayout = ({children}) => (
  <div className="app login-layout">
    <div className="login-layout-container">
      <div className="login-layout-container-section">
        {children}
      </div>
      <div className="login-layout-container-section">
        <img src={logo} className="logo" alt="Embark Logo"/>
      </div>
    </div>
  </div>
);

export default LoginLayout;
