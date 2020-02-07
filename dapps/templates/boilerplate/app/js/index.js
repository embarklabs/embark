import EmbarkJS from 'Embark/EmbarkJS';

// import your contracts
// e.g if you have a contract named SimpleStorage:
//import SimpleStorage from 'Embark/contracts/SimpleStorage';

EmbarkJS.onReady((err) => {
  // You can execute contract calls after the connection
});

// OR if using "library: 'web3'" in config/contracts.js

// import web3 from '../../embarkArtifacts/web3.js';
// import SimpleStorage from '../embarkArtifacts/contracts/SimpleStorage';
// web3.onReady(async () => {
//  let accounts = await web3.eth.getAccounts();
//})
