### API Documentation

#### 1. **Transaction API**

**Endpoint:** `POST /api/transaction`

**Description:** Broadcasts a Radiant transaction, including optional donations.

**Request Body:**
```json
{
  "myAddress": "string",         // Required: Sender's Radiant address
  "toAddress": "string",         // Required: Recipient's Radiant address
  "amount": "number",            // Required: Amount to send
  "donation": "string",          // Optional: Donation type ("networkMiners" or custom address)
  "donationAmount": "number",    // Optional: Donation amount
  "donationAddress": "string"    // Optional: Address for donation
}
```

**Responses:**
- **200 OK:**
  ```json
  {
    "success": true,
    "message": "Transaction broadcasted successfully",
    "data": {
      "txId": "string" // Transaction ID
    }
  }
  ```
- **400 Bad Request:** Missing fields, invalid addresses, or insufficient funds.
- **500 Internal Server Error:** Unexpected errors.

---

#### 2. **Get Total Balance API**

**Endpoint:** `POST /api/getTotalBalance`

**Description:** Retrieves the confirmed balance for a given Radiant address.

**Request Body:**
```json
{
  "address": "string" // Required: Radiant address
}
```

**Responses:**
- **200 OK:**
  ```json
  {
    "success": true,
    "message": "Balance Retrieved",
    "data": "number" // Confirmed balance
  }
  ```
- **400 Bad Request:** Missing or invalid address.
- **500 Internal Server Error:** Unexpected errors.

---

#### 3. **Generate Address API**

**Endpoint:** `POST /api/genAddress`

**Description:** Generates a new Radiant address for a user and stores it in the database.

**Request Body:**
```json
{
  "userid": "string" // Required: User ID
}
```

**Responses:**
- **201 Created:**
  ```json
  {
    "success": true,
    "message": "Address generated successfully",
    "data": {
      "addressId": "number",  // Database ID for the address
      "userid": "string",     // User ID
      "address": "string",    // Generated Radiant address
      "time": "number"        // Timestamp of generation
    }
  }
  ```
- **422 Unprocessable Entity:** Missing or invalid User ID.
- **500 Internal Server Error:** Unexpected errors.

---

#### 4. **Check Deposit API**

**Endpoint:** `POST /api/checkDeposit`

**Description:** Verifies deposits to a specific Radiant address and updates its usage status.

**Request Body:**
```json
{
  "address": "string" // Required: Radiant address
}
```

**Responses:**
- **200 OK (Deposit Found):**
  ```json
  {
    "success": true,
    "message": "Deposit found and address marked as used",
    "data": {
      "depositHistory": "array" // List of deposits
    }
  }
  ```
- **200 OK (No Deposit):**
  ```json
  {
    "success": true,
    "message": "No deposits found for this address",
    "data": []
  }
  ```
- **404 Not Found:** Address not found or already marked as used.
- **422 Unprocessable Entity:** Missing or invalid address.
- **500 Internal Server Error:** Unexpected errors.

---

### Notes:
1. **Error Handling:** All APIs include error handling for missing parameters, invalid inputs, and unexpected server errors.
2. **Security:**
   - Ensure that sensitive data like private keys and seed phrases are securely stored and transmitted.
   - Use HTTPS for API requests.
3. **Database Integration:** Ensure the database queries are secure and prevent SQL injection attacks by using placeholders or parameterized queries.