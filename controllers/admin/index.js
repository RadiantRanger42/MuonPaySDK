import getAddressUTXOs from "../../utils/getUtxos.js";
import broadcastTransaction from "../../utils/broadcast_trans.js";
import validateRadiantAddress from "../../utils/addr_validity.js";
import getConfirmedBal from "../../utils/get_confimed_bal.js";
import getTransactionHistory from "../../utils/get_trans_history.js";

import Secrets from "../../config/secrets.js";
import db from "../../config/databse.js";
import bitcoin from "bitcoinjs-lib";
import pkg from "@radiantblockchain/radiantjs";

import { parse } from 'json2csv';

import generateRadiantAddress from "../../utils/gen_new_addr.js";
import { Satoshi } from "bitcoinjs-lib/src/types.js";

const { Transaction } = pkg;

export const last_7_days = async (req, res) => {

    const sevenDaysAgoMidnight = Math.floor(new Date(new Date().setHours(0, 0, 0, 0) - 7 * 86400000).getTime() / 1000);

    const [check] = await db.query(
        "SELECT SUM(amount) as amnt FROM address_used WHERE used = ? AND time > ?",
        [true, sevenDaysAgoMidnight]
      );
      
      if (check.length === 0) {
        // No rows found that match the request, i.e., not used and for that user and tries are less than 8
      
        
      } else {
        // get the total amount
        const total_amnt_7days = check[0]['amnt'] / 100000000; //convert to RXD instead of satoshis
        return res.status(200).json({
            'success' : true,
            'amount_last_7_days' : total_amnt_7days,
            'message' : "successfully retrieved"
        })
      }      
      
      return res.status(402).json({
        'success' : false,
        'message' : "Unsuccessfull"
    })

}

export const pending_payments = async (req , res) => 
{
    const [pending_pay] = await db.query(
        "SELECT COUNT(id) as pending FROM address_used WHERE used = ? AND tries < 60",
        [false]
      );

      if(pending_pay.length == 0)
      {}else{
        
        return res.status(200).json({
            success : true,
            pending : parseInt(pending_pay[0].pending),
            message : "Succesfully Retrieved"
        })
      }

      
      return res.status(402).json({
        success : false,
        message : "Request Was not successfull"
    })

}



export const completed_payments = async (req , res) => {

    const sevenDaysAgoMidnight = Math.floor(new Date(new Date().setHours(0, 0, 0, 0) - 7 * 86400000).getTime() / 1000);
    const [completed_pay] = await db.query(
        "SELECT COUNT(id) as completed1 FROM address_used WHERE used = ? AND time > ? ",
        [true , sevenDaysAgoMidnight]
      );

      if(completed_pay.length == 0)
      {}else{
        
        
        return res.status(200).json({
            success : true,
            completed : parseInt(completed_pay[0].completed1),
            message : "Succesfully Retrieved"
        })
      }

      
      return res.status(402).json({
        success : false,
        message : "Request Was not successfull"
    })

}



export const completedList = async (req , res) => 
{
    // Generate JSON that has list of completed deposits with a pagination system 
    try {
        // Get page and limit from query parameters (default to 1 for page and 10 for limit)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;
    
       
    
        // Query to get the completed deposits (used = true, time > sevenDaysAgoMidnight)
        const [results] = await db.execute(
          `SELECT id, userid, time, address, p_key, amount, used, cleared, clearedTrxHash, tries
           FROM address_used
           WHERE used = ?
           ORDER BY time DESC
           LIMIT ? OFFSET ?`,
          [true, limit, offset]
        );
    
        // Query to get the total count of completed deposits within the last 7 days (used = true)
        const [[{ count }]] = await db.execute(
          `SELECT COUNT(id) AS count
           FROM address_used
           WHERE used = ?`,
          [true]
        );
    
        // Calculate total pages
        const totalPages = Math.ceil(count / limit);
    
        // Send JSON response with data and pagination information
        res.status(200).json({
          success: true,
          message: 'Completed deposits retrieved successfully',
          data: results,
          pagination: {
            currentPage: page,
            totalPages: totalPages,
            totalCount: count,
            limit: limit,
          }
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({
          success: false,
          message: 'An error occurred while retrieving completed deposits',
          error: error.message,
        });
      }
}


export const pendingList = async (req , res) => 
    {
        // Generate JSON that has list of completed deposits with a pagination system 
        try {
            // Get page and limit from query parameters (default to 1 for page and 10 for limit)
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const offset = (page - 1) * limit;
        
           
        
            // Query to get the completed deposits (used = true, time > sevenDaysAgoMidnight)
            const [results] = await db.execute(
              `SELECT id, userid, time, address, p_key, amount, used, cleared, clearedTrxHash, tries
               FROM address_used
               WHERE used = ? AND tries < 60
               ORDER BY time DESC
               LIMIT ? OFFSET ?`,
              [false, limit, offset]
            );
        
            // Query to get the total count of completed deposits within the last 7 days (used = true)
            const [[{ count }]] = await db.execute(
              `SELECT COUNT(id) AS count
               FROM address_used
               WHERE used = ? and tries < 60`,
              [false]
            );
        
            // Calculate total pages
            const totalPages = Math.ceil(count / limit);
        
            // Send JSON response with data and pagination information
            res.status(200).json({
              success: true,
              message: 'Pending deposits retrieved successfully',
              data: results,
              pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalCount: count,
                limit: limit,
              }
            });
          } catch (error) {
            console.error(error);
            res.status(500).json({
              success: false,
              message: 'An error occurred while retrieving pending deposits',
              error: error.message,
            });
          }
    }


    // Function to calculate midnight timestamp 7 days ago
const getSevenDaysAgoMidnight = () => {
    const date = new Date();
    date.setDate(date.getDate() - 14);
    date.setHours(0, 0, 0, 0);  // Set to midnight
    return Math.floor(date.getTime() / 1000); // Return Unix timestamp
  };
  
  export const GenCSV = async (req, res) => {
    try {
      // Calculate the timestamp of 7 days ago at midnight
      const sevenDaysAgoMidnight = getSevenDaysAgoMidnight();
  
      // Query to get all completed deposits (used = true, time > sevenDaysAgoMidnight)
      const [results] = await db.execute(
        `SELECT id, userid, time, address, p_key, amount, used, cleared, clearedTrxHash, tries
         FROM address_used
         WHERE used = true AND time > ?
         ORDER BY time DESC`,
        [sevenDaysAgoMidnight]
      );
  
      // Convert the results to CSV format
      const csv = parse(results);
  
      // Set the appropriate headers for file download
      res.header('Content-Type', 'text/csv');
      res.header('Content-Disposition', 'attachment; filename=completed_deposits.csv');
  
      // Send the CSV file as the response
      res.send(csv);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'An error occurred while retrieving completed deposits',
        error: error.message,
      });
    }
  };


  export const purge = async (req , res) =>
  {
    const [process_purge] = await db.query("DELETE FROM `address_used` WHERE used = ? AND clearedTrxHash  != '' " , [true]);

    const [process_purge1] = await db.query("DELETE FROM `address_used` WHERE used = ? AND tries > 59 " , [false]);
     res.status(200).redirect('/admin-user-panel?msg=Purged Successfully&msg_type=warning');
  }

export const update_server_url = async (req, res) => {
  const { server_url } = req.body;
  
  const query = await db.query("UPDATE `settings` SET `value` = ? WHERE `name` = 'electrumx_server_url'  " , [server_url]);
  console.log(query)

  return res.status(200).redirect("/admin-user-panel/server.html?msg=Succesfully updated to : "+server_url + "&msg_type=success")
}

export const current_url = async (req , res) => 
{


  const url = await db.query("SELECT `value` FROM `settings` WHERE `name` = 'electrumx_server_url'  ");

  if(url.length == 0)
  {
      return res.status(402).json({
        success : false,
        message :  "Unexpected error fetching the url"
      })
  }


  const url1 = url[0]
  return res.status(200).json({
    success : true,
    url: url1[0].value
  })

}