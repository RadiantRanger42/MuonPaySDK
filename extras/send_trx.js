// const WebSocket = require('ws');
// const Radiant = require('@radiantblockchain/radiantjs');
// const bip39 = require('bip39');
// const ecc = require('tiny-secp256k1');
// const { BIP32Factory } = require('bip32');
// const { ECPairFactory } = require('ecpair');

// // Initialize BIP32 and ECPair
// const bip32 = BIP32Factory(ecc);
// const ECPair = ECPairFactory(ecc);
// let mainnet = Radiant.Networks.livenet;
// var keypair = ECPair.makeRandom(mainnet);

// console.log(keypair.toWIF())

const radiant = require('@radiantblockchain/radiantjs'); // RadiantJS library
const {ECPairFactory} = require('ecpair');
const ecc = require('tiny-secp256k1');
const ECPair = ECPairFactory(ecc);

// Radiant network
const network = radiant.Networks.regtest; // Use radiant.networks.testnet for testnet

/**
 * Retrieve address and public key from WIF
 * @param {string} wif - Wallet Import Format private key
 * @returns {Object} Address and public key
 */
function getAddressAndPublicKeyFromWIF(wif) {
  try {
    // Decode WIF to get the key pair
    const keyPair = ECPair.fromWIF(wif, network);

    // Get the public key in hex format
    const publicKey = keyPair.publicKey.toString('hex');

    // Generate the address
    const { address } = radiant.payments.p2pkh({ pubkey: keyPair.publicKey, network });

    return { address, publicKey };
  } catch (error) {
    throw new Error(`Error decoding WIF: ${error.message}`);
  }
}

// Example usage
try {
  const wif = 'L2dZwYJaoCsz8CZ3zSYgXmtmLh34hQPg7MmxhMK64EBt9jSaDgv3'; // Replace with your WIF
  const result = getAddressAndPublicKeyFromWIF(wif);

  console.log('Address:', result.address);
  console.log('Public Key:', result.publicKey);
} catch (error) {
  console.error('Error:', error.message);
}
