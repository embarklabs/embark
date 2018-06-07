let shelljs = require('shelljs');

class Simulator {
  constructor(options) {
    this.blockchainConfig = options.blockchainConfig;
    this.logger = options.logger;
    this.contractsConfig = options.contractsConfig;
    this.events = options.events;
  }

  run(options) {
    let cmds = [];

    const testrpc = shelljs.which('testrpc');
    const ganache = shelljs.which('ganache-cli');
    if (!testrpc && !ganache) {
      this.logger.warn(__('%s is not installed on your machine', 'Ganache CLI (TestRPC)'));
      this.logger.info(__('You can install it by running: %s', 'npm -g install ganache-cli'));
      process.exit();
    }

    cmds.push("-p " + ((options.port || this.blockchainConfig.rpcPort || 8545) + 1));
    
    
    cmds.push("-h " + (options.host || this.blockchainConfig.rpcHost || 'localhost'));
    cmds.push("-a " + (options.numAccounts || 10));
    cmds.push("-e " + (options.defaultBalance || 100));
    cmds.push("-l " + (options.gasLimit || 8000000));

    // adding mnemonic only if it is defined in the blockchainConfig or options
    let simulatorMnemonic = this.blockchainConfig.simulatorMnemonic || options.simulatorMnemonic;
    if (simulatorMnemonic) {
      cmds.push("--mnemonic \"" + (simulatorMnemonic) +"\"");
    }

    // adding blocktime only if it is defined in the blockchainConfig or options
    let simulatorBlocktime = this.blockchainConfig.simulatorBlocktime || options.simulatorBlocktime;
    if (simulatorBlocktime) {
      cmds.push("-b \"" + (simulatorBlocktime) +"\"");
    }

    const program = ganache ? 'ganache-cli' : 'testrpc';

     shelljs.exec(`${program} ${cmds.join(' ')} &`, {async : true});
   
      let httpProxy = require('http-proxy');
      let http = require('http');
      let _port = options.port || this.blockchainConfig.rpcPort || 8545;
      let _host = (options.host || this.blockchainConfig.rpcHost || 'localhost');

      let commList = {};

      let proxy = httpProxy.createProxyServer({});
      let server = http.createServer((req, res) => {

        let reqBody = [];
        req.on('data', (b) => { reqBody.push(b); })
           .on('end', () => {
              reqBody = Buffer.concat(reqBody).toString();
              if(reqBody){
                let jsonO = JSON.parse(reqBody);
                if(jsonO.method == "eth_sendTransaction"){
                  commList[jsonO.id] = {
                    requestData: jsonO.params.data
                  };
                }
              }
            });

        proxy.proxyRequest(req, res, {
          target:  `http://${_host}:${_port + 1}`
        });

        proxy.on('proxyRes', function (proxyRes, req, res) {
          let resBody = [];
          proxyRes.on('data', (b) => resBody.push(b))
          proxyRes.on('end', function () {
            resBody = Buffer.concat(resBody).toString();
            try {
              let jsonO = JSON.parse(resBody);
              if(commList[jsonO.id]){
                commList[json0.id].transactionHash = resBody;

                // TODO: decode commlist
                // ” SimpleStorage> set(5) | tx: 0xef234f16etc ”

                delete commList[json0.id];
              }
            } catch(e){
              //
            }
          });        
        });

      });
      
      server.listen(_port);
    
  }
}

module.exports = Simulator;
