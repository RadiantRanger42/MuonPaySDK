const bitcoin = require('bitcoinjs-lib');
const bs58check = require('bs58check');
const crypto = require('crypto');
const WebSocket = require('ws');

// The ElectrumX server WebSocket URL
const electrumxServer = 'wss://electrumx.radiant4people.com:50022';

// Your public address
const publicAddress = '1KpexCQfzF6XPGyzv8EfdFeY8FafX62y8A';

// Convert the public address to a script hash
function addressToScriptHash(address) {
    const script = bitcoin.address.toOutputScript(address);
    const hash = crypto.createHash('sha256').update(script).digest();
    return Buffer.from(hash.reverse()).toString('hex');
}

const scriptHash = addressToScriptHash(publicAddress);

// Create a WebSocket connection
const ws = new WebSocket(electrumxServer);

ws.on('open', () => {
    console.log('Connected to ElectrumX server');

    // Request UTXOs for the script hash
    const request = JSON.stringify({
        id: 1,
        method: 'blockchain.scripthash.listunspent',
        params: [scriptHash]
    });

    ws.send(request);
});

ws.on('message', (data) => {
    const response = JSON.parse(data);
    
    if (response.id === 1) {
        console.log('UTXOs:', response.result);
        ws.close();
    }
});

ws.on('error', (error) => {
    console.error('WebSocket error:', error);
});

ws.on('close', () => {
    console.log('Disconnected from ElectrumX server');
});
