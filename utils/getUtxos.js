import WebSocket from "ws";
import bitcoin from "bitcoinjs-lib";
import pkg from "@radiantblockchain/radiantjs";
import Secrets from "../config/secrets.js";

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
