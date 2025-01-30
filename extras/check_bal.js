// const WebSocket = require("ws");
// const bitcoin = require("bitcoinjs-lib");

import WebSocket from "ws";
import bitcoin from "bitcoinjs-lib";

// CHECK THE BALANCE OF AN ADDRESS

export async function getAddressBalance(address) {
  const url = "wss://electrumx.radiant4people.com:50022";
  const ws = new WebSocket(url);

  ws.on("open", function open() {
    const script = bitcoin.address.toOutputScript(address);
    const hash = bitcoin.crypto.sha256(script).reverse().toString("hex");

    console.log(hash);

    const request = JSON.stringify({
      jsonrpc: "2.0",
      // method: "blockchain.scripthash.get_balance",

      method: "blockchain.scripthash.listunspent",
      params: [hash],
      id: 1,
    });

    ws.send(request);
  });

  ws.on("message", function incoming(data) {
    const response = JSON.parse(data);
    if (response.result) {
      console.log({ response, result: response?.result });
      ws.close();
      return response;
    } else {
      console.error("Error:", response.error);
      ws.close();
    }
    ws.close();
  });

  ws.on("error", function error(err) {
    console.error("WebSocket Error:", err);
  });

  ws.on("close", function close() {
    console.log("WebSocket connection closed");
  });
}

getAddressBalance("17i2aGngSprVCqfMCtD1zUhE82g9eM5Z2v");

/*
8578f1bad32e71c226f7308b1f8269680952ac0d51ce75e5fe57d838449e935d
{"jsonrpc":"2.0","result":[{"tx_hash":"dfd2e978ef58b780f728488d4c05a2fa4a8be8ee365b5f1b60cc0a770bef344b","tx_pos":0,"height":282562,"value":10000000,"refs":[]}],"id":1}
*/
