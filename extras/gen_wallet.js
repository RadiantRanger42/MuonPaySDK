const Radiant = require('@radiantblockchain/radiantjs');
const ecc = require('tiny-secp256k1');
const ECPairFactory = require('ecpair');
const bitcoin = require('bitcoinjs-lib');

// Initialize ECPair with tiny-secp256k1
const ECPair = ECPairFactory.ECPairFactory(ecc);

// Generate a new key pair
const keyPair = ECPair.makeRandom();

// Get the private key in WIF format
const privateKeyWIF = keyPair.toWIF();

// Create a public key buffer
const publicKeyBuffer = Buffer.from(keyPair.publicKey);

// Generate a public address using bitcoinjs-lib
const { address } = bitcoin.payments.p2pkh({ pubkey: publicKeyBuffer });

// Display the private key and address
console.log(`Private Key: ${privateKeyWIF}`);
console.log(`Public Address: ${address}`);
