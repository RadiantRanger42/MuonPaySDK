const bitcoin = require('bitcoinjs-lib');  // BitcoinJS library
const WebSocket = require('ws');           // WebSocket for ElectrumX connection
const ecc = require('tiny-secp256k1')
const ECPairFactory = require('ecpair')
// ElectrumX server WebSocket URL

const ECPair = ECPairFactory.ECPairFactory(ecc);
const electrumXUrl = 'wss://electrumx.radiant4people.com:50022';

// Sender's private key (WIF format) and address
const senderPrivateKeyWIF = 'KwEY84SDfZ92GsrYHtgiYBsXLhKUvfmCbUZqWUwDLzmnqH91WW4P';
const senderAddress = '17i2aGngSprVCqfMCtD1zUhE82g9eM5Z2v';

// Recipients' details
const recipients = [
  { address: '1JFmjM14bptrV1G9SomNeY4Z7t161cnAnE', amount: 0.0005 }
];

// Helper function to convert address to script hash (ElectrumX needs script hashes)
function addressToScripthash(address) {
  return "8578f1bad32e71c226f7308b1f8269680952ac0d51ce75e5fe57d838449e935d"
}

// WebSocket client setup
const ws = new WebSocket(electrumXUrl);

ws.on('open', () => {
  console.log('Connected to ElectrumX server');
  // Start fetching UTXOs after WebSocket connection is open
  createTransaction();
});

// Fetch UTXOs from ElectrumX
function getUTXOs(callback) {
  const scripthash = addressToScripthash(senderAddress);
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'blockchain.scripthash.listunspent',
    params: [scripthash]
  };
  // Send request after WebSocket is open
  ws.send(JSON.stringify(request));

  // Listen for the response from ElectrumX
  ws.on('message', (data) => {
    const response = JSON.parse(data);
    if (response.result) {
        console.log(response.result)
      callback(response.result);
    } else {
      console.error('Error fetching UTXOs:', response.error);
      callback([]);
    }
  });
}

// Create and sign the transaction
async function createTransaction() {
  getUTXOs((utxos) => {
    // Calculate the total amount to send
    const totalAmountToSend = recipients.reduce((sum, recipient) => sum + recipient.amount, 0);

    // Select inputs (UTXOs)
    let inputs = [];
    let totalInputAmount = 0;
    for (let utxo of utxos) {
      if (totalInputAmount >= totalAmountToSend) break;
      inputs.push({
        txid: utxo.tx_hash,  // Transaction ID
        vout: utxo.index,    // Output Index
        value: utxo.value    // Value in satoshis
      });
      totalInputAmount += utxo.value;
    }

    // Ensure sufficient funds
    if (totalInputAmount < totalAmountToSend) {
      console.error('Not enough funds in the selected UTXOs');
      return;
    }

    // Prepare outputs
    const outputs = recipients.map(recipient => ({
      address: recipient.address,
      value: Math.floor(recipient.amount * 1e8)  // Convert to satoshis
    }));

    // Add change output
    const fee = 1000;  // Transaction fee in satoshis
    const change = totalInputAmount - totalAmountToSend - fee;
    if (change > 0) {
      outputs.push({
        address: senderAddress,
        value: change
      });
    }

    // Create the raw transaction
    const psbt = new bitcoin.Psbt();
    inputs.forEach(input => {
      psbt.addInput({
        hash: 'dfd2e978ef58b780f728488d4c05a2fa4a8be8ee365b5f1b60cc0a770bef344b',  // Transaction hash (ID)
        index: 0, // Output index
      });
    });

    outputs.forEach(output => {
      psbt.addOutput({
        address: '1JFmjM14bptrV1G9SomNeY4Z7t161cnAnE',
        value: 1
      });
    });

    // Sign the transaction
    const keyPair = ECPair.fromWIF(senderPrivateKeyWIF);
    psbt.signAllInputs(keyPair);
    psbt.finalizeAllInputs();

    // Get the raw transaction hex
    const rawTxHex = psbt.extractTransaction().toHex();
    console.log('Raw Transaction Hex:', rawTxHex);

    // Broadcast the transaction
    broadcastTransaction(rawTxHex);
  });
}

// Broadcast the transaction using ElectrumX over WebSocket
function broadcastTransaction(rawTxHex) {
  const request = {
    jsonrpc: '2.0',
    id: 2,
    method: 'blockchain.broadcast',
    params: [rawTxHex]
  };
  ws.send(JSON.stringify(request));

  ws.on('message', (data) => {
    const response = JSON.parse(data);
    if (response.result) {
      console.log('Transaction broadcasted:', response.result);
    } else {
      console.error('Error broadcasting transaction:', response.error);
    }
  });
}





// WALLET :
// Private Key: L2TzxQAwyoS65R7YLKhWwatY8g7YYjXpXbfYWxUwwhAniPqDP3jW
// Public Address: 1KpexCQfzF6XPGyzv8EfdFeY8FafX62y8A