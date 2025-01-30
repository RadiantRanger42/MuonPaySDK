import getAddressUTXOs from "../../utils/getUtxos.js";
import broadcastTransaction from "../../utils/broadcast_trans.js";
import validateRadiantAddress from "../../utils/addr_validity.js";
import generateAddresses from "../../utils/gen_new_addr.js";
import getConfirmedBal from "../../utils/get_confimed_bal.js";

import Secrets from "../../config/secrets.js";
import pkg from "@radiantblockchain/radiantjs";
import db from "../../config/databse.js";
import bitcoin from "bitcoinjs-lib";
import getTransactionHistory from "../../utils/get_trans_history.js";

import WebSocket from "ws";
import bitcoin from "bitcoinjs-lib";
import pkg from "@radiantblockchain/radiantjs";
import Secrets from "../config/secrets.js";
const { Transaction, UnspentOutput } = pkg;

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

    if (!myAddress || !toAddress) {
      return res.status(400).json({
        success: false,
        message: "Sender and receiver addresses are required",
      });
    }

    const addressIsValid = validateRadiantAddress(toAddress);
    if (!addressIsValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid recipient Radiant address",
      });
    }

    const utxos = await getAddressUTXOs(myAddress);
    if (!utxos || utxos.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No available UTXOs for the given address",
      });
    }

    const totalAvailable = utxos.reduce((sum, utxo) => sum + utxo.value, 0);

    let tx = new Transaction().from(utxos).to(toAddress, amount);

    const feeRate = 2000;

    // Calculate Transaction Size
    const transactionSize =
      tx.toBuffer().length >= 200 ? tx.toBuffer().length : 230;

    // Calculate Fee
    const calculatedFee = transactionSize * feeRate;

    // Set Fee
    tx = tx.fee(calculatedFee);

    const neededAmount =
      parseFloat(amount) +
      (donation && donationAmount > 0 ? parseFloat(donationAmount) : 0) +
      calculatedFee;

    if (neededAmount > totalAvailable) {
      return res.status(400).json({
        success: false,
        message: "Insufficient funds for the transaction",
      });
    }

    if (donation && donationAmount > 0) {
      if (donation === "networkMiners") {
        const newFee = calculatedFee + donationAmount; // Add the donation amount to the current fee
        tx = tx.fee(newFee);
      } else {
        const donationAddressIsValid = validateRadiantAddress(donationAddress);
        if (!donationAddressIsValid) {
          return res.status(400).json({
            success: false,
            message: "Invalid donation address",
          });
        }
        tx = tx.to(donationAddress, donationAmount);
      }
    }

    tx = tx.change(myAddress).sign(Secrets.PRIVATE_KEY);

    const rawTxHex = tx.toString();

    const txId = await broadcastTransaction(rawTxHex);

    return res.status(200).json({
      success: true,
      message: "Transaction broadcasted successfully",
      data: { txId },
    });
  } catch (error) {
    console.error({ error });
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: error.message || "An unknown error occurred",
    });
  }
};

export const getTotalBalance = async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "My Radiant Address is required",
      });
    }

    const utxos = await getConfirmedBal(address);

    const confimredBal = utxos.result.confirmed;

    return res.status(200).json({
      success: true,
      message: "Balance Retrieved",
      data: confimredBal,
    });
  } catch (error) {
    console.error({ error });
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: error.message || "An unknown error occurred",
    });
  }
};

export const genAddress = async (req, res) => {
  try {
    const { userid } = req.body;

    // Validate input
    if (!userid) {
      return res.status(422).json({
        success: false,
        message: "User ID is required",
      });
    }

    const time = Date.now();

    const seedPhrase = Secrets.SEED_PHRASE;
    const addressIndex = Math.floor(Math.random() * 8999 + 100000);

    const { address, privateKey } = await generateAddresses(
      seedPhrase,
      addressIndex
    );

    // Insert into the database securely using placeholders
    const query =
      "INSERT INTO address_used (userid, time, address, p_key, used, cleared) VALUES (?, ?, ?, ?, ?, ?)";
    const values = [userid, time, address, privateKey, false, false]; // Using false for the 'used' column

    // Execute the query
    const [result] = await db.query(query, values);

    // Return success response
    return res.status(201).json({
      success: true,
      message: "Address generated successfully",
      data: {
        addressId: result.insertId, // Return the inserted row's ID
        userid,
        address,
        time,
      },
    });
  } catch (error) {
    console.error("Error in genAddress:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: error.message || "An unknown error occurred",
    });
  }
};

export const checkDeposit = async (req, res) => {
  try {
    const { address } = req.body;

    if (!address) {
      return res.status(422).json({
        success: false,
        message: "Address is required",
      });
    }

    // Fetch row from the database with address and used = false
    const [rows] = await db.query(
      "SELECT * FROM address_used WHERE address = ? AND used = ?",
      [address, false]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Address not found or already used",
      });
    }

    const row = rows[0];

    const script = bitcoin.address.toOutputScript(address);
    const scriptHash = bitcoin.crypto.sha256(script).reverse().toString("hex");

    // Fetch deposit history using scripthash
    const depositHistory = await getTransactionHistory(scriptHash);

    if (depositHistory && depositHistory.length > 0) {
      // Update the database to mark this address as used
      await db.query("UPDATE address_used SET used = ? WHERE id = ?", [
        true,
        row.id,
      ]);

      return res.status(200).json({
        success: true,
        message: "Deposit found and address marked as used",
        data: { depositHistory },
      });
    } else {
      return res.status(200).json({
        success: true,
        message: "No deposits found for this address",
        data: [],
      });
    }
  } catch (error) {
    console.error("Error in checkDeposit:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      data: error.message || "An unknown error occurred",
    });
  }
};

async function getAddressUTXOs(address) {
  const url = Secrets?.ELECTRUMX_URL;
  const ws = new WebSocket(url);

  return new Promise((resolve, reject) => {
    ws.on("open", () => {
      try {
        const script = bitcoin.address.toOutputScript(address);
        const hash = bitcoin.crypto.sha256(script).reverse().toString("hex");

        const request = JSON.stringify({
          jsonrpc: "2.0",
          method: "blockchain.scripthash.listunspent",
          params: [hash],
          id: 1,
        });

        ws.send(request);
      } catch (error) {
        reject(`Error preparing request: ${error.message}`);
        ws.close();
      }
    });

    ws.on("message", (data) => {
      try {
        const response = JSON.parse(data);
        if (response.result) {
          // Transform UTXOs into the required format
          const utxos = response.result.map((utxo) => {
            return {
              txid: utxo.tx_hash,
              vout: utxo.tx_pos,
              satoshis: utxo.value,
              scriptPubKey: bitcoin.address
                .toOutputScript(address)
                .toString("hex"), // Optional, ensure scriptPubKey matches
            };
          });
          resolve(utxos);
        } else {
          reject(`Error from server: ${response.error}`);
        }
      } catch (error) {
        reject(`Error parsing response: ${error.message}`);
      } finally {
        ws.close();
      }
    });

    ws.on("error", (err) => {
      reject(`WebSocket Error: ${err.message}`);
    });

    ws.on("close", () => {
      console.log("WebSocket connection closed");
    });
  });
}

export default getAddressUTXOs;
