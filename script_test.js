var Web3 = require('web3');

web3 = new Web3();

web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'))

EmbarkJS = require('./js/embark.js');

MyToken = require('./test_app/dist/js/mytoken.js');

console.log(MyToken.address);

MyToken.balanceOf(web3.eth.accounts[0]).then((x) => console.log(x.toNumber()));

