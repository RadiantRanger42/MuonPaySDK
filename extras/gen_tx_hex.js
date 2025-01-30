const bitcoin = require('bitcoinjs-lib');
const bs58check = require('bs58check');
const crypto = require('crypto');
const WebSocket = require('ws');
const bitcore = require('bitcore-lib');

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
        const utxos = response.result;
        console.log('UTXOs:', utxos);

        // Create the raw transaction
        const tx = new bitcore.Transaction();

        // Add UTXOs as inputs
        utxos.forEach(utxo => {
            tx.from({
                txId: utxo.tx_hash,
                outputIndex: utxo.tx_pos,
                address: publicAddress,
                script: bitcore.Script.fromAddress(publicAddress),
                satoshis: utxo.value
            });
        });

        // Add the recipient output
        const recipientAddress = '17i2aGngSprVCqfMCtD1zUhE82g9eM5Z2v';
        const amountToSend = 1000; // 0.00001 RXD in satoshis (1 RXD = 100,000,000 satoshis)
        const fee = 500; // A suitable fee in satoshis

        tx.to(recipientAddress, amountToSend);

        // Calculate the total input amount
        const totalInputAmount = utxos.reduce((sum, utxo) => sum + utxo.value, 0);

        // Calculate the change amount
        const changeAmount = totalInputAmount - amountToSend - fee;

        // Add the change output if there's any change left
        if (changeAmount > 0) {
            tx.change(publicAddress);
        }

        // Generate the raw transaction hex (unsigned)
        const rawTxHex = tx.uncheckedSerialize();
        console.log('Raw Transaction Hex (unsigned):', rawTxHex);

        ws.close();
    }
});

ws.on('error', (error) => {
    console.error('WebSocket error:', error);
});

ws.on('close', () => {
    console.log('Disconnected from ElectrumX server');
});
