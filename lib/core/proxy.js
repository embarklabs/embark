const httpProxy = require('http-proxy');
const http = require('http');
const constants = require('../constants.json');

let commList = {};
let transactions = {}; 
let receipts = {};

const parseRequest = function(reqBody){
    let jsonO;
    try {
        jsonO = JSON.parse(reqBody);
    } catch(e){
        return; // Request is not a json. Do nothing
    }
    if(jsonO.method === "eth_sendTransaction"){
        commList[jsonO.id] = {
            type: 'contract-log',
            address: jsonO.params[0].to,
            data: jsonO.params[0].data
        };
    } else if(jsonO.method === "eth_getTransactionReceipt"){
        if(transactions[jsonO.params[0]]){
            transactions[jsonO.params[0]].receiptId = jsonO.id;
            receipts[jsonO.id] = transactions[jsonO.params[0]].commListId;
        }
    }
};

const parseResponse = function(ipc, resBody){
    let jsonO;
    try {
        jsonO = JSON.parse(resBody);
    } catch(e) {
        return; // Response is not a json. Do nothing
    }

    if(commList[jsonO.id]){
        commList[jsonO.id].transactionHash = jsonO.result;
        transactions[jsonO.result] = {commListId: jsonO.id};
    } else if(receipts[jsonO.id] && jsonO.result && jsonO.result.blockNumber){
        commList[receipts[jsonO.id]].blockNumber = jsonO.result.blockNumber;
        commList[receipts[jsonO.id]].gasUsed = jsonO.result.gasUsed;
        commList[receipts[jsonO.id]].status = jsonO.result.status;
        
        if(ipc.connected && !ipc.connecting){
            ipc.request('log', commList[receipts[jsonO.id]]);
        } else {
            ipc.connecting = true;
            ipc.connect(() => {
                ipc.connecting = false;
            });
        }

        delete transactions[commList[receipts[jsonO.id]].transactionHash];
        delete receipts[jsonO.id];
        delete commList[jsonO.id];
    }
};

exports.serve = function(ipc, host, port, ws){
    let proxy = httpProxy.createProxyServer({
        target: {
            host,
            port: port + constants.blockchain.servicePortOnProxy
          },
        ws: ws
    });

    proxy.on('error', function (e) {
        console.error(__("Error forwarding requests to blockchain/simulator"), e.message);
    });

    proxy.on('proxyRes', (proxyRes) => {
        let resBody = [];
        proxyRes.on('data', (b) => resBody.push(b));
        proxyRes.on('end', function () {
            resBody = Buffer.concat(resBody).toString();
            if(resBody){
                parseResponse(ipc, resBody);
            }
        });
    });

    let server = http.createServer((req, res) => {
        let reqBody = [];
        req.on('data', (b) => { reqBody.push(b); })
            .on('end', () => {
                reqBody = Buffer.concat(reqBody).toString();
                if(reqBody){
                    parseRequest(reqBody);
                }
            });

        if(!ws){
            proxy.web(req, res);
        }
    });

    if(ws){
        const WsParser = require('simples/lib/parsers/ws'); // npm install simples

        server.on('upgrade', function (req, socket, head) {
            proxy.ws(req, socket, head);
        });

        proxy.on('open', (proxySocket) => {
            proxySocket.on('data', (data) => {
                parseResponse(ipc, data.toString().substr(data.indexOf("{")));
            });
        });
         
         proxy.on('proxyReqWs', (proxyReq, req, socket) => {
             var parser = new WsParser(0, false);
             socket.pipe(parser);
             parser.on('frame', function (frame) {
                parseRequest(frame.data);
             });
         
         });
    }

    server.listen(port);
};
