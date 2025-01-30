const WebSocket = require('ws');
const crypto = require('crypto');
// GET AVAILABLE INFO ABOUT A TRANSACTION HASH 

async function transaction_info(address) {
  const url = 'wss://electrumx.radiant4people.com:50022';
  const ws = new WebSocket(url);

  ws.on('open', function open() {
    const request = JSON.stringify({
      jsonrpc: '2.0',
      method: 'blockchain.transaction.get',
      params: ['dfd2e978ef58b780f728488d4c05a2fa4a8be8ee365b5f1b60cc0a770bef344b' , true],
      id: 1
    });
    ws.send(request);
  });

  ws.on('message', function incoming(data) {
    const response = JSON.parse(data);
    if (response.result) {
      console.log(JSON.stringify(response));
    } else {
      console.error('Error:', response.error);
    }
    ws.close();
  });

  ws.on('error', function error(err) {
    console.error('WebSocket Error:', err);
  });

  ws.on('close', function close() {
    console.log('WebSocket connection closed');
  });
}

transaction_info('17i2aGngSprVCqfMCtD1zUhE82g9eM5Z2v');
