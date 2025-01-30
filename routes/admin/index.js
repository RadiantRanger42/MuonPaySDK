import express from "express";
const router = express.Router();

import {
  last_7_days,
  pending_payments,
  completed_payments,
  completedList,
  pendingList,
  GenCSV,
  purge,
  update_server_url,
  current_url
} from "../../controllers/admin/index.js";

router.route("/last_7_days").post(last_7_days);
router.route("/pending_payments").post(pending_payments)
router.route("/completed_payments").post(completed_payments)
router.route("/completed-list").post(completedList)
router.route("/pending-list").post(pendingList)
router.route("/gen-csv").get(GenCSV)
router.route("/purge").get(purge)
router.route("/update_server_url").post(update_server_url)
router.route("/current_url").post(current_url)

export default router;