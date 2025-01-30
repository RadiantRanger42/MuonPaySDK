const express = require('express');
const app = express();
const PORT = 3000;
const WebSocket = require('ws');
const bitcoin = require('bitcoinjs-lib');

let globalResponse = '';
// Middleware to parse JSON
app.use(express.json());

// Helper function stubs (Replace with actual implementation)
const checkAddress = (address) => {
  // CHECK IF THE ADDRESS IS VALID 
  const validateRadiantAddress = (address) => {
    try {
      bitcoin.address.toOutputScript(address);
      return true;
    } catch (e) {
      return false;
    }
  };
  
  const isValid = validateRadiantAddress(address);
  
  console.log(`Is address ${address} valid?`, isValid);
  if(isValid){
    var msg = 'Address is valid';
  }else{
    var msg = 'Address is not Valid'
  }
  return { valid: isValid, message: msg };
};

const checkBalance = (address) => {
  // Replace with logic to check balance of the address
    
    async function getAddressBalance(address) {
      const url = 'wss://electrumx.radiant4people.com:50022';
      const ws = new WebSocket(url);
    
      ws.on('open', function open() {
        const script = bitcoin.address.toOutputScript(address); 
        const hash = bitcoin.crypto.sha256(script).reverse().toString('hex');
        // console.log(hash)
        const request = JSON.stringify({
          jsonrpc: '2.0',
          method: 'blockchain.scripthash.get_balance',
          params: [hash],
          id: 1
        });
        ws.send(request);
      });
    
      ws.on('message', function incoming(data) {
        const response = JSON.parse(data);
        if (response.result) {
            globalResponse = response;
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

      return globalResponse;
     

    }
    
    
    
    getAddressBalance('17i2aGngSprVCqfMCtD1zUhE82g9eM5Z2v');

    return { balance: globalResponse.result, unit: 'RXD' };
};

const createTransaction = (fromAddress, toAddress, amount) => {
  // Replace with logic to create a transaction
  return { txId: 'sample_tx_id_12345', status: 'created' };
};

const getTransactionHistory = (address) => {
  // Replace with logic to fetch transaction history
  return {
    transactions: [
      { txId: 'tx123', amount: 50, type: 'sent', timestamp: '2024-12-25T10:00:00Z' },
      { txId: 'tx456', amount: 100, type: 'received', timestamp: '2024-12-24T15:30:00Z' },
    ],
  };
};

// Routes
app.get('/check_addr', (req, res) => {
  // const { address } = req.body.address;
  const address = '17i2aGngSprVCqfMCtD1zUhE82g9eM5Z2v'
  // if (!address) {
  //   return res.status(400).json({ error: 'Address is required' });
  // }
  const result = checkAddress(address);
  res.json(result);
});

app.get('/check_bal', (req, res) => {
  const { address } = req.body;
//   if (!address) {
//     return res.status(400).json({ error: 'Address is required' });
//   }
  const result = checkBalance(address);
  res.json(result);
});

app.get('/create_tx', (req, res) => {
  const { fromAddress, toAddress, amount } = req.body;
  if (!fromAddress || !toAddress || amount === undefined) {
    return res.status(400).json({ error: 'From address, to address, and amount are required' });
  }
  const result = createTransaction(fromAddress, toAddress, amount);
  res.json(result);
});

app.get('/get_tx_his', (req, res) => {
  const { address } = req.body;
  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }
  const result = getTransactionHistory(address);
  res.json(result);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
