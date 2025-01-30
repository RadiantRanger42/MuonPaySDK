# Muon Pay SDK

Muon Pay SDK is a powerful and easy-to-integrate solution for merchants looking to accept payments on the Radiant (RXD) blockchain. Built by ThinkDot Solutions, Muon Pay provides a streamlined way to handle transactions, deposits, and balance management through a RESTful API.

---

## Features
- **Send & receive payments** using Radiant (RXD) in photons.
- **Generate new deposit addresses** for seamless merchant transactions.
- **Check balances** and transaction statuses in real-time.
- **Automated postback system** to notify backend systems of payments.
- **Admin panel** for managing server settings.

## Prerequisites
- **Node.js v21+** (required for smooth operation)
- **ElectrumX Server** for blockchain communication
- **.env file** for configuration

## Installation
```bash
# Clone the repository
git clone https://github.com/your-repo/muon-pay-sdk.git
cd muon-pay-sdk

# Install dependencies
npm install

# Start the server
npm run server
```

## API Endpoints
All API methods use **POST** requests.

### **1. Broadcast a Transaction**
**Endpoint:** `/api/user/transaction/broadcast`

#### Request Parameters:
```json
{
  "myAddress": "string",
  "toAddress": "string",
  "amount": "integer (in photons)"
}
```

#### Responses:
- **Success:**
```json
{
  "success": true,
  "message": "Transaction broadcasted successfully",
  "data": { "txId": "string" }
}
```
- **Error Cases:**
```json
{
  "success": false,
  "message": "Sender and receiver addresses are required"
}
```
```json
{
  "success": false,
  "message": "Insufficient funds for the transaction"
}
```

---

### **2. Get Balance**
**Endpoint:** `/api/user/transaction/balance`

#### Request Parameters: None

#### Responses:
- **Success:**
```json
{
  "success": true,
  "message": "Balance Retrieved",
  "confirmedBalance": "integer",
  "unconfirmedBalance": "integer",
  "totalBalance": "integer"
}
```
- **Error:**
```json
{
  "success": false,
  "message": "Radiant Address is required"
}
```

---

### **3. Generate New Deposit Address**
**Endpoint:** `/api/user/transaction/new/address`

#### Request Parameters:
```json
{
  "userid": "integer",
  "amountNeeded": "integer"
}
```

#### Responses:
- **Success:**
```json
{
  "success": true,
  "message": "Address generated successfully",
  "data": {
    "addressId": "integer",
    "userid": "integer",
    "amount": "integer",
    "fee": "integer",
    "address": "string",
    "time": "timestamp"
  }
}
```
- **Error:**
```json
{
  "success": false,
  "message": "User ID / Unique Identifier is required"
}
```

---

### **4. Check Deposit Status**
**Endpoint:** `/api/user/transaction/check/deposit`

#### Request Parameters:
```json
{
  "address": "string"
}
```

#### Responses:
- **Success (Payment Found):**
```json
{
  "success": true,
  "found": true,
  "message": "Payment was found",
  "ReqAmount": "integer",
  "amountReceived": "integer",
  "amountFulfilled": "boolean",
  "data": { "depositHistory": [] }
}
```
- **Success (No Payment Found):**
```json
{
  "success": true,
  "found": false,
  "message": "No Payments found for this address",
  "data": []
}
```
- **Error:**
```json
{
  "success": false,
  "message": "Address is required"
}
```

---

### **5. Postback Data (Automatic Notification)**
Muon Pay SDK sends a POST request to the `POSTBACK_URL` (configured in `.env`) when a payment is received.

#### Postback Payload:
```json
{
  "success": true,
  "id": "integer",
  "message": "Payment was found",
  "ReqAmount": "integer",
  "amountReceived": "integer",
  "amountFulfilled": "boolean",
  "data": { "depositHistory": [] },
  "method": "credit"
}
```

---

## **Admin Panel**
Admins can access the control panel at:
```
/admin-user-panel
```
### **Features:**
- View key metrics
- Change ElectrumX server (requires app restart)
- Update admin credentials (modify `server.js`)

---

## **Support & Integration**
For integration help or custom development, contact **RxddApps**.

---

## **License**
Muon Pay SDK is open-source under the [MIT License](LICENSE).

**Built with ❤️ by ThinkDot Solutions.** 🚀
