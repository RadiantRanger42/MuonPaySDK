import { getAddressBalance, validateRadiantAddress } from "./utils";

const bitcoin = require("bitcoinjs-lib");
const ECPairFactory = require("ecpair").default;
const WebSocketClient = require("websocket").client;
const tinysecp = require("tiny-secp256k1");
const crypto = require("crypto");

// Create an ECPair factory
const ECPair = ECPairFactory(tinysecp);

// Private key in WIF format
const privateKeyWIF = "L2TzxQAwyoS65R7YLKhWwatY8g7YYjXpXbfYWxUwwhAniPqDP3jW";

// Create a key pair from the private key
const keyPair = ECPair.fromWIF(privateKeyWIF);
const publicKey = Buffer.from(keyPair.publicKey);

// Public address and script hash
const publicAddress = "1KpexCQfzF6XPGyzv8EfdFeY8FafX62y8A";
const script = bitcoin.address.toOutputScript(publicAddress);
const scriptHash = crypto
  .createHash("sha256")
  .update(script)
  .digest()
  .reverse()
  .toString("hex");

// Recipient address and amount to send in satoshis
const recipientAddress = "17i2aGngSprVCqfMCtD1zUhE82g9eM5Z2v";
const amount = 1000; // 0.00001 RXD

// ElectrumX server URL
const electrumxServer = "wss://electrumx.radiant4people.com:50022";

// Function to connect to ElectrumX server and get UTXOs
const getUtxos = (scriptHash) => {
  return new Promise((resolve, reject) => {
    const client = new WebSocketClient();

    client.on("connect", (connection) => {
      console.log("Connected to ElectrumX server");
      connection.send(
        JSON.stringify({
          id: 1,
          method: "blockchain.scripthash.listunspent",
          params: [scriptHash],
        })
      );

      connection.on("message", (message) => {
        const response = JSON.parse(message.utf8Data);
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
        connection.close();
      });

      connection.on("error", (error) => {
        reject(error);
      });
    });

    client.connect(electrumxServer);
  });
};

// Function to get raw transaction from ElectrumX server
const getRawTransaction = (txid) => {
  return new Promise((resolve, reject) => {
    const client = new WebSocketClient();

    client.on("connect", (connection) => {
      console.log("Fetching raw transaction for txid:", txid);
      connection.send(
        JSON.stringify({
          id: 2,
          method: "blockchain.transaction.get",
          params: [txid, false], // Fetch raw transaction with verbose=false
        })
      );

      connection.on("message", (message) => {
        const response = JSON.parse(message.utf8Data);
        if (response.error) {
          reject(response.error);
        } else {
          resolve(response.result);
        }
        connection.close();
      });

      connection.on("error", (error) => {
        reject(error);
      });
    });

    client.connect(electrumxServer);
  });
};

// Function to create and sign transaction
const createAndSignTransaction = async () => {
  try {
    const utxos = await getUtxos(scriptHash);
    console.log("UTXOs:", utxos);

    if (utxos.length === 0) {
      console.error("No UTXOs found.");
      return;
    }

    // Create a new Partially Signed Bitcoin Transaction (PSBT)
    const psbt = new bitcoin.Psbt();

    // Add the input from UTXOs
    for (const utxo of utxos) {
      const txid = utxo.tx_hash; // No reversing needed
      const rawTx = await getRawTransaction(txid);
      console.log("Raw Transaction for UTXO:", rawTx);
      psbt.addInput({
        hash: Buffer.from(txid, "hex"),
        index: utxo.tx_pos,
        nonWitnessUtxo: Buffer.from(rawTx, "hex"),
      });
    }

    // Add the output
    psbt.addOutput({
      address: recipientAddress,
      value: amount,
    });

    // Add change output if necessary
    const totalInput = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
    const fee = 500; // Example fee, adjust as necessary
    const change = totalInput - amount - fee;
    if (change > 0) {
      psbt.addOutput({
        address: publicAddress,
        value: change,
      });
    }

    // Sign the transaction
    for (let i = 0; i < utxos.length; i++) {
      const redeemScript = bitcoin.payments.p2pkh({ pubkey: publicKey }).output;
      psbt.updateInput(i, { redeemScript: redeemScript });
      psbt.signInput(i, keyPair);
    }

    // Finalize the transaction
    psbt.finalizeAllInputs();

    // Get the signed transaction hex
    const signedTxHex = psbt.extractTransaction().toHex();

    // Output the signed transaction hex
    console.log(`Signed Transaction Hex: ${signedTxHex}`);
  } catch (error) {
    console.error("Error:", error);
  }
};

// Run the function
createAndSignTransaction();

export const transaction = async (req, res) => {
  try {
    const {
      myAddress,
      toAddress,
      amount,
      donation,
      donationAmount,
      donationAddress,
    } = req.body;
    const addressIsValid = validateRadiantAddress(toAddress);

    if (!addressIsValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid Radiant address",
      });
    }

    // const utxos = ???? ;

    if (donation && donationAmount > 0) {
      const neededAmount = parseFloat(amount) + parseFloat(donationAmount);

      const getBalance = getAddressBalance(myAddress);
      const confirmedBalance = parseFloat(getBalance?.result?.confirmed);

      if (neededAmount > confirmedBalance) {
        return res.status(400).json({
          success: false,
          message: "Insufficient funds for the transaction",
        });
      }

      if ((donation = "networkMiners")) {
        let transaction = new Transaction()
          .from(utxos) // Feed information about what unspent outputs one can use
          .to(toAddress, amount) // Add an output with the given amount of satoshis
          .change(myAddress) // Sets up a change address where the rest of the funds will go
          .sign(privkeySet); // Signs all the inputs it can
        // .fee(?)
      } else {
        const donationAddressIsValid = validateRadiantAddress(donationAddress);

        if (!donationAddressIsValid) {
          return res.status(400).json({
            success: false,
            message: "Donation Radiant Address is Invalid",
          });
        }

        let transaction = new Transaction()
          .from(utxos) // Feed information about what unspent outputs one can use
          .to(toAddress, amount) // Add an output with the given amount of satoshis
          .change(myAddress) // Sets up a change address where the rest of the funds will go
          .sign(privkeySet); // Signs all the inputs it can
      }
    } else {
      const getBalance = getAddressBalance(myAddress);
      const confirmedBalance =
        parseFloat(getBalance?.result?.confirmed) / 10000000;

      if (amount > confirmedBalance) {
        return res.status(400).json({
          success: false,
          message: "Insufficient funds for the transaction",
        });
      }

      let transaction = new Transaction()
        .from(utxos) // Feed information about what unspent outputs one can use
        .to(toAddress, amount) // Add an output with the given amount of satoshis
        .change(myAddress) // Sets up a change address where the rest of the funds will go
        .sign(privkeySet); // Signs all the inputs it can
    }
  } catch (error) {
    console.log({ error });
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: error?.message || "An unkown error occured.",
    });
  }
};
