import getAddressUTXOs from "../../utils/getUtxos.js";
import broadcastTransaction from "../../utils/broadcast_trans.js";
import validateRadiantAddress from "../../utils/addr_validity.js";
import getConfirmedBal from "../../utils/get_confimed_bal.js";
import getTransactionHistory from "../../utils/get_trans_history.js";

import Secrets from "../../config/secrets.js";
import db from "../../config/databse.js";
import bitcoin from "bitcoinjs-lib";
import pkg from "@radiantblockchain/radiantjs";

import generateRadiantAddress from "../../utils/gen_new_addr.js";
import { Satoshi } from "bitcoinjs-lib/src/types.js";
import { constants } from "crypto";

const { Transaction } = pkg;

export const transaction = async (req, res) => {
  try {
    const {
      myAddress,
      toAddress,
      amount
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

    const totalAvailable = utxos.reduce((sum, utxo) => sum + utxo.satoshis, 0);
    console.log(amount);
    let tx = new Transaction().from(utxos).to(toAddress, amount);

    const feeRate = 2500;

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
    const donationAmount = 0;
    const donation = false ;
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
    const address  = Secrets.DEFAULT_ADDRESS;

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Radiant Address is required",
      });
    }

    const utxos = await getConfirmedBal(address);

    const confimredBal = utxos.result.confirmed;
    const unConfimredBal = utxos.result.unconfirmed;
    const totalAvailable = confimredBal + unConfimredBal;

    return res.status(200).json({
      success: true,
      message: "Balance Retrieved",
      confimredBalance :  confimredBal,
      unconfirmedBalance :  unConfimredBal,
      totalBalance :  totalAvailable
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
      // Everything is in Smaller unit / Satoshi / Photon 
    // user id is also Unique Identifier
    const userid  = parseInt( req.body.userid );
    // The minimum amount needed to mark as paid  
    const amountNeeded = parseInt( req.body.amountNeeded );

    

    // Validate input
    if (!userid) {
      return res.status(422).json({
        success: false,
        message: "User ID / Unique Identifier is required",
        time : Date.now()
      });
    }
    // validate amount 
    if (!amountNeeded || isNaN(amountNeeded)) {
      return res.status(422).json({
        success: false,
        message: "Amount is not set OR is non numeric",
        time : Date.now()
      });
    }
    
const [check] = await db.query(
  "SELECT * FROM address_used WHERE userid = ? AND used = ? AND tries < 8",
  [userid, false]
);

if (check.length === 0) {
  // No rows found that match the request, i.e., not used and for that user and tries are less than 8

  
} else {
  // Since we already have the data from `check`, use it directly
  // however we will update the amount just to be sure
  const addressData1 = check[0]; // Take the first unused address

  await db.query(
    "UPDATE `address_used` SET `amount` = ? , `time` = ?  WHERE `id` = ?",
    [amountNeeded , Date.now(),  addressData1.id]
  );

  const [checkagain] = await db.query(
    "SELECT * FROM address_used WHERE userid = ? AND used = ? AND tries < 8",
    [userid, false]
  );

  const addressData = checkagain[0]; // Take the first unused address of updated rows

  return res.status(201).json({
    success: true,
    message: "Address retrieved successfully",
    data: {
      addressId: addressData.id, // Assuming there's an `id` field in the table
      userid: addressData.userid,
      amount : parseFloat(addressData.amount),
      fee : parseInt(addressData.amount * (1/100)),
      address: addressData.address, // Assuming there's an `address` field
      time: addressData.time, // Assuming there's a `time` field
    },
  });
}

    
    const time = Date.now();

    const { address, privateKey } = await generateRadiantAddress();

    // Insert into the database securely using placeholders
    const query =
      "INSERT INTO address_used (userid, time, address, amount , p_key, used, cleared) VALUES (?, ?, ?, ?, ?, ?, ?)";
    const values = [userid, time, address , amountNeeded , privateKey, false, false]; // Using false for the 'used' column

    // Execute the query
    const [result] = await db.query(query, values);

    // Return success response
    return res.status(201).json({
      success: true,
      message: "Address generated successfully",
      data: {
        addressId: result.insertId, // Return the inserted row's ID
        userid,
        amount: amountNeeded,
        fee : parseInt(amountNeeded * (1/100)),
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
      "SELECT * FROM address_used WHERE address = ? AND used = ? AND tries < 60",
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
    
    const utxos = await getConfirmedBal(address);

    const confimredBal = utxos.result.confirmed;
    const unConfimredBal = utxos.result.unconfirmed;

    // GET BOTH CONFIRMED AND UNCONFIRMED BALANCES 
    const totalBalance = confimredBal + unConfimredBal 

    await db.query("UPDATE address_used SET `tries` = `tries` + ? ", [
        1
      ]);
    
    if (depositHistory && depositHistory.length > 0 && totalBalance > 0) {
      // Return that deposit amount has been found 
      // check the amount stored in db is greater or smaller than required 
      // First convert RXD to Smaller unit (Satoshi or Photon) 
      if ((row.amount) > totalBalance)
      {
        var fulfill =  false ;
      }else{
        var fulfill = true;
      }

      return res.status(200).json({
        success: true,
        found : true,
        message: "Payment was found",
        ReqAmount : parseInt(row.amount), 
        amountRecieved : totalBalance, 
        amountFulfilled : fulfill,
        data: { depositHistory },
      });
    } else {
      return res.status(200).json({
        success: true,
        found : false,
        message: "No Payments found for this address",
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
