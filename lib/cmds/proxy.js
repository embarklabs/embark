const httpProxy = require('http-proxy');
const http = require('http');

exports.serve = function(host, port){
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
        target:  `http://${host}:${port + 1}`
        });

        proxy.on('proxyRes', (proxyRes, req, res) => {
            let resBody = [];
            proxyRes.on('data', (b) => resBody.push(b))
            proxyRes.on('end', function () {
                resBody = Buffer.concat(resBody).toString();
                try {
                let jsonO = JSON.parse(resBody);
                if(commList[jsonO.id]){
                    commList[jsonO.id].transactionHash = resBody;

                    // TODO: decode commlist
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
}
