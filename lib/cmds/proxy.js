const httpProxy = require('http-proxy');
const http = require('http');

exports.serve = function(host, port, ws){
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
                            address: jsonO.params[0].to,
                            requestData: jsonO.params[0].data
                        };
                    }
                }
            });

        proxy.proxyRequest(req, res, {
            target: {
                host: host,
                port: port + 10,
                ws: ws
            }
        });

        proxy.on('proxyRes', (proxyRes, req, res) => {
            let resBody = [];
            proxyRes.on('data', (b) => resBody.push(b))
            proxyRes.on('end', function () {
                resBody = Buffer.concat(resBody).toString();
                try {
                    let jsonO = JSON.parse(resBody);
                    if(commList[jsonO.id]){
                        commList[jsonO.id].transactionHash = jsonO.result;
                        // TODO: decode commlist
                        // TODO: send messages to console
                        // ” SimpleStorage> set(5) | tx: 0xef234f16etc ”
                        delete commList[jsonO.id];
                    }
                } catch(e){
                //
                }
            });        
        });

    });

    server.listen(port);
};
