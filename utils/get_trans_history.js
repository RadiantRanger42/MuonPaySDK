import Secrets from "../config/secrets.js";
import WebSocket from "ws";

async function getTransactionHistory(scriptHash) {
  const url = Secrets?.ELECTRUMX_URL;
  const ws = new WebSocket(url);

  return new Promise((resolve, reject) => {
    ws.on("open", () => {
      const request = JSON.stringify({
        jsonrpc: "2.0",
        method: "blockchain.scripthash.get_history",
        params: [scriptHash],
        id: 1,
      });
      ws.send(request);
    });

    ws.on("message", (data) => {
      const response = JSON.parse(data);
      if (response.result) {
        resolve(response.result); // Array of transactions
      } else {
        console.log({ transactionHistoryError: response.error });
        reject(`Error fetching history: ${response.error}`);
      }
      ws.close();
    });

    ws.on("error", (err) => {
      reject(`WebSocket Error: ${err.message}`);
    });

    ws.on("close", () => {
      console.log("WebSocket connection closed");
    });
  });
}

export default getTransactionHistory;
