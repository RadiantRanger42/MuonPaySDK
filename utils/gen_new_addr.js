import bsv from "bsv";

const generateRadiantAddress = async () => {
  try {
    // Create a new private key
    const privateKeyObject = new bsv.PrivateKey();

    // Export the private key in WIF format
    const exportedWIF = privateKeyObject.toWIF(); // Wallet Import Format

    // Generate an address from the private key
    const address = privateKeyObject.toAddress();

    // Validate the private key by re-importing
    const importedKey = bsv.PrivateKey.fromWIF(exportedWIF);
    const derivedAddress = importedKey.toAddress();

    if (derivedAddress.toString() === address.toString()) {
      console.log("Validation Successful: Private key controls the address.");
      return { address: address.toString(), privateKey: exportedWIF };
    } else {
      throw new Error(
        "Validation Failed: Private key does not control the address."
      );
    }
  } catch (error) {
    console.error("Error generating Radiant address:", error);
    return null;
  }
};

export default generateRadiantAddress;
