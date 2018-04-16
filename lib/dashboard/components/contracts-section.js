import 'bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './contracts-section.css';

import EmbarkJS from 'Embark/EmbarkJS';
import IdentityFactory from 'Embark/contracts/IdentityFactory'; // Import all contracts

import ContractUI from './contracts/contract-ui';


__embarkContext.execWhenReady(function(){
    
    // Each contract should be available on window
    window["IdentityFactory"] = IdentityFactory;
    
    ReactDOM.render(
        <ContractUI name="IdentityFactory" contract={IdentityFactory} sourceURL="https://raw.githubusercontent.com/status-im/contracts/contracts-ui-demo/contracts/identity/IdentityFactory.sol" />,
        document.getElementById('root')
      );


});
