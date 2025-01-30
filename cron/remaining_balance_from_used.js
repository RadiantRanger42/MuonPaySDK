import { scheduleJob } from "node-schedule";

import Secrets from "../config/secrets.js";
import pkg from "@radiantblockchain/radiantjs";
import db from "../config/databse.js";
import bitcoin from "bitcoinjs-lib";
import getTransactionHistory from "../utils/get_trans_history.js";
const { Transaction } = pkg;

import getConfirmedBal from "../utils/get_confimed_bal.js";

import getAddressUTXOs from "../utils/getUtxos.js";
import broadcastTransaction from "../utils/broadcast_trans.js";
import validateRadiantAddress from "../utils/addr_validity.js";
import { add } from "bsv/lib/networks.js";
// import { verifyKeyControlsAddress } from "../utils/gen_new_addr.js";
import axios from "axios";


const defaultAddress = Secrets.DEFAULT_ADDRESS;
const postback_url = Secrets.POSTBACK_URL;


// Cron Job to process used addresses
const processUsedAddresses = async () => {
  // Runs every hour
  try {
    console.log("Cron job started: Processing used addresses");

    // Fetch all used addresses from the database
    const [rows] = await db.query("SELECT * FROM address_used WHERE used = ? AND `cleared` = ? ", [
      true, false
    ]);

    if (rows.length === 0) {
      console.log("No addresses with 'used = true' AND cleared =  false found.");
      return;
    }

    let totalAmount = 0;
    let utxos = [];

    for (const row of rows) {
      const { address, p_key, id } = row;

      // Validate the address
      if (!validateRadiantAddress(address)) {
        console.log(`Invalid address skipped: ${address}`);
        continue;
      }

      // Fetch UTXOs for the address
      const addressUTXOs = await getAddressUTXOs(address);

      if (addressUTXOs && addressUTXOs.length > 0) {
        utxos = utxos.concat(
          addressUTXOs.map((utxo) => ({ ...utxo, p_key, address, id }))
        ); // Attach the p_key, address, and id for later
        totalAmount += addressUTXOs.reduce(
          (sum, utxo) => sum + utxo.satoshis,
          0
        );
      }
    }

    if (totalAmount === 0 || utxos.length === 0) {
      console.log("No UTXOs available to process.");
      return;
    }

    // Group UTXOs by private key to create separate transactions per address
    const groupedUTXOs = utxos.reduce((groups, utxo) => {
      const { p_key } = utxo;
      if (!groups[p_key]) {
        groups[p_key] = [];
      }
      groups[p_key].push(utxo);
      return groups;
    }, {});

    // Process transactions for each private key group
    for (const [p_key, keyUTXOs] of Object.entries(groupedUTXOs)) {
      const totalAvailable = keyUTXOs.reduce(
        (sum, utxo) => sum + utxo.satoshis,
        0
      );

      // Create transaction
      let tx = new Transaction().from(keyUTXOs);

      // Calculate and set fee
      const feeRate = 2000;
      const transactionSize =
        tx.toBuffer().length >= 200 ? tx.toBuffer().length : 230;
      const calculatedFee = Math.ceil(transactionSize * feeRate) + 3000;

      const transferAmount1 =
        parseFloat(totalAvailable) - parseFloat(calculatedFee);

      const transferAmount = transferAmount1 - parseInt(transferAmount1 * (1/100));
      const rxddapps_fee = parseInt(transferAmount1 * (1/100))
      console.log({ rxddapps_fee , totalAvailable, calculatedFee, transferAmount });

      if (transferAmount <= 0) {
        console.log("Insufficient funds for the transaction ");
        continue;
      }


      if(rxddapps_fee > 0)
      {
        tx = tx.to("1HYJxnVH5vCExFTcu64zXjwx5AMcZ941bZ", rxddapps_fee);
      }

      tx = tx
        .to(defaultAddress, transferAmount)
        // .fee(calculatedFee)
        .change(defaultAddress)
        .sign(p_key);
      

      // Broadcast transaction
      const rawTxHex = tx.toString();

      const txId = await broadcastTransaction(rawTxHex);
      console.log(`Transaction successful for p_key: ${p_key}, txId: ${txId}`);

      // Update database
      const usedAddressIds = keyUTXOs.map((utxo) => utxo.id);
      await db.query(
        `UPDATE address_used SET cleared = ?, clearedTrxHash = ? WHERE id IN (?)`,
        [true, txId, usedAddressIds]
      );

      console.log("Database updated: Addresses marked as cleared.");
    }
  } catch (error) {
    console.error("Error in cron job:", error);
  }
};

// Cron Job to process used addresses
const processUsedAddressesBackup = async () => {
  // Runs every hour
  try {
    console.log("Cron job started: Processing used addresses");

    // Fetch all used addresses from the database
    const [rows] = await db.query("SELECT * FROM address_used WHERE used = ?", [
      true,
    ]);

    if (rows.length === 0) {
      console.log("No addresses with 'used = true' found.");
      return;
    }

    for (const row of rows) {
      const { address, p_key, id } = row;

      // Validate the address
      if (!validateRadiantAddress(address)) {
        console.log(`Invalid address skipped: ${address}`);
        continue;
      }

      // Fetch UTXOs for the address
      const utxos = await getAddressUTXOs(address);

      if (!utxos || utxos.length === 0) {
        console.log(`No UTXOs for address: ${address}`);
        continue;
      }

      const totalAvailable = utxos.reduce(
        (sum, utxo) => sum + utxo.satoshis,
        0
      );

      console.log(
        `Processing address: ${address}, Total UTXOs: ${totalAvailable}`
      );

      // Create and broadcast the transaction for this address

      let tx = new Transaction().from(utxos);

      // Calculate and set fee
      const feeRate = 2000;
      const transactionSize =
        tx.toBuffer().length >= 200 ? tx.toBuffer().length : 230;
      const calculatedFee = transactionSize * feeRate;

      const transferAmount =
        parseFloat(totalAvailable) - parseFloat(calculatedFee);

      console.log({ totalAvailable, calculatedFee, transferAmount, p_key });

      if (transferAmount <= 0) {
        console.log("Insufficient funds for the transaction ");
        continue;
      }

      tx = tx
        .to(defaultAddress, transferAmount)
        .fee(calculatedFee)
        .change(defaultAddress)
        .sign(p_key);

      // Broadcast transaction
      const rawTxHex = tx.toString();
      const txId = await broadcastTransaction(rawTxHex);

      console.log(
        `Transaction successful for address: ${address}, txId: ${txId}`
      );

      // Update database for the processed address
      await db.query(
        `UPDATE address_used SET cleared = ?, clearedTrxHash = ? WHERE id IN (?)`,
        [true, txId, id]
      );

      console.log(`Database updated: Address ${address} marked as cleared.`);
    }
  } catch (error) {
    console.error("Error in cron job:", error);
    console.log({ error });
  }
};

const postbackSend =  async () => {
  
  const [addresses] = await db.query(
    "SELECT * FROM address_used WHERE used = ? AND tries < 60",
    [false]
  );
  // check the number of returned arrays
  if(addresses.length > 0)
    { 
      // console.log(addresses)
      for(var row of addresses)
      {
        try {
          const { address } = row;
          const { id } = row; 
          if (!address) {
            return res.status(422).json({
              success: false,
              message: "Address is required",
            });
          }
      

      
          const script = bitcoin.address.toOutputScript(address);
          const scriptHash = bitcoin.crypto.sha256(script).reverse().toString("hex");
      
          // Fetch deposit history using scripthash
          const depositHistory = await getTransactionHistory(scriptHash);
          
          const utxos = await getConfirmedBal(address);
      
          const confimredBal = utxos.result.confirmed;

      
          await db.query("UPDATE address_used SET `tries` = `tries` + ? , `used` = ? ", [
              1 , true
            ]);
          
          if (depositHistory && depositHistory.length > 0 && confimredBal > 0) {
            // Return that deposit amount has been found 
            // check the amount stored in db is greater or smaller than required 
            // First convert RXD to Smaller unit (Satoshi or Photon) 
            if ((row.amount) > confimredBal)
            {
              // does not fulfil the criteria required 
              var fulfill =  false ;
            }else{
              var fulfill = true;
            }
      
            const postbackData = {
              success: true,
              id, 
              message: "Payment was found",
              ReqAmount : parseInt(row.amount), 
              amountRecieved : confimredBal, 
              amountFulfilled : fulfill,
              data: { depositHistory },
              method : "credit"
            };

            axios
            .post(postback_url, postbackData, {
              headers: {
                "Content-Type": "application/json", // Specify JSON content type
              },
            })
            .then((response) => {
              console.log("Postback sent successfully:", response.data);
              // Marked as used already so no need to do anything 
            })
            .catch((error) => {
              console.error("Error sending postback:", error.response?.data || error.message);
              // set to unused so can be tried again later
               db.query(
                "UPDATE `address_used` SET `used` = ? WHERE `id` = ? ",
                [false , id]
              );

            });

          } else {
            console.log({
              success: true,
              found : "no",
              message: "No Payments found for this address",
              data: [],
            });
          }
        } catch (error) {
          console.error("Error in checkDeposit:", error);
          console.log({
            success: false,
            message: "Internal Server Error",
            data: error.message || "An unknown error occurred",
          });
        }
      }

    }
}



scheduleJob("*/5 * * * *", async () => {
  await postbackSend();
});


scheduleJob("40 20 * * *", async () => {
  await processUsedAddresses();
});