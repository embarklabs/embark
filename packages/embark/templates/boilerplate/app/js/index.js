import EmbarkJS from 'Embark/EmbarkJS';
import config from '../../embarkArtifacts/config/blockchain.json';

// import your contracts
// e.g if you have a contract named SimpleStorage:
//import SimpleStorage from 'Embark/contracts/SimpleStorage';


EmbarkJS.Blockchain.connect(config, (err) => {
  // You can execute contract calls after the connection
});
