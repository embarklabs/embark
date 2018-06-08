const httpProxy = require('http-proxy');
const http = require('http');

exports.serve = function(ipc, host, port, ws){
    let commList = {};
    let transactions = {}; 
    let receipts = {};

    let proxy = httpProxy.createProxyServer({
        target: {
            host: host,
            port: port + 10
          },
        ws: ws
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
                    transactions[jsonO.result] = {commListId: jsonO.id};
                } else if(receipts[jsonO.id]){
                    commList[receipts[jsonO.id]].blockNumber = jsonO.result.blockNumber;
                    commList[receipts[jsonO.id]].gasUsed = jsonO.result.gasUsed;
                    commList[receipts[jsonO.id]].status = jsonO.result.status;
                   
                    if(ipc.connected && !ipc.connecting){
                        ipc.request('log', commList[receipts[jsonO.id]]);
                    } else {
                        ipc.connecting = true;
                        ipc.connect((err) => {
                            ipc.connecting = false;
                        });
                    }

                    delete transactions[commList[receipts[jsonO.id]].transactionHash];
                    delete receipts[jsonO.id];
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
                    } else if(jsonO.method == "eth_getTransactionReceipt"){
                        if(transactions[jsonO.params[0]]){
                            transactions[jsonO.params[0]].receiptId = jsonO.id;
                            receipts[jsonO.id] = transactions[jsonO.params[0]].commListId;
                        }
                    }
                }
            });

        if(!ws){
            proxy.web(req, res);
        }
    });

    if(ws){
        server.on('upgrade', function (req, socket, head) {
            proxy.ws(req, socket, head);
        });
    }

    server.listen(port);
};
