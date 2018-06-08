const httpProxy = require('http-proxy');
const http = require('http');

exports.serve = function(ipc, host, port, ws){
    let commList = {};

    let proxy = httpProxy.createProxyServer({
        target: {
            host: host,
            port: port + 10,
            ws: ws
          }
    });

    proxy.on('proxyRes', (proxyRes) => {
        let resBody = [];
        proxyRes.on('data', (b) => resBody.push(b));
        proxyRes.on('end', function () {
            resBody = Buffer.concat(resBody).toString();
            try {
                let jsonO = JSON.parse(resBody);
                if(commList[jsonO.id]){
                    commList[jsonO.id].transactionHash = jsonO.result;
                    if(ipc.connected && !ipc.connecting){
                        ipc.request('log', commList[jsonO.id]);
                    } else {
                        ipc.connecting = true;
                        ipc.connect((err) => {
                            ipc.connecting = false;
                        });
                    }
                    delete commList[jsonO.id];
                }
            } catch(e){
            //
            }
        });        
    });

    let server = http.createServer((req, res) => {
        let reqBody = [];
        req.on('data', (b) => { reqBody.push(b); })
            .on('end', () => {
                reqBody = Buffer.concat(reqBody).toString();
                if(reqBody){
                    let jsonO = JSON.parse(reqBody);
                    if(jsonO.method == "eth_sendTransaction"){
                        commList[jsonO.id] = {
                            type: 'contract-log',
                            address: jsonO.params[0].to,
                            data: jsonO.params[0].data
                        };
                    }
                }
            });

        if(ws){
            proxy.ws(req, res);
        } else {
            proxy.web(req, res);
        }

    });

    server.listen(port);
};
