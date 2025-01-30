const bip39 = require('bip39');
const bitcore = require('bitcore-lib');  // Import bitcore-lib

// Recovery phrase (replace with your actual phrase)
const recoveryPhrase = "duty chuckle camp oven armed dinner there frame elder course expect six";

// Step 1: Convert the recovery phrase to a seed
const seed = bip39.mnemonicToSeedSync(recoveryPhrase);

// Step 2: Derive the private key using BIP32 (HD Wallet)
const HDPrivateKey = bitcore.HDPrivateKey.fromSeed(seed);

// Step 3: Get the private key (you can change the derivation path if needed)
const privateKey = HDPrivateKey.derive("m/44'/0'/0'/0/0").privateKey;

// Step 4: Convert the private key to WIF format
const wif = privateKey.toWIF();

// Output the private key in WIF format
console.log("Private Key (WIF):", wif);
