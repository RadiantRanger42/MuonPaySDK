import express from "express";
const router = express.Router();

import {
  transaction,
  getTotalBalance,
  genAddress,
  checkDeposit
} from "../../controllers/transaction/index.js";

router.route("/broadcast").post(transaction);

router.route("/balance").post(getTotalBalance);

router.route("/new/address").post(genAddress);

router.route("/check/deposit").post(checkDeposit);


export default router;