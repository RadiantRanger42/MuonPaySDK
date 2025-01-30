// const bitcoin = require("bitcoinjs-lib");
import bitcoin from "bitcoinjs-lib";

// CHECK IF THE ADDRESS IS VALID
const validateRadiantAddress = (address) => {
  try {
    bitcoin.address.toOutputScript(address);
    return true;
  } catch (error) {
    console.error({ error });
    return false;
  }
};

export default validateRadiantAddress;
