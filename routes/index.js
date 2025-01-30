import Transaction from "./transaction/index.js";
import Admin from "./admin/index.js";
const Routes = (app) => {
  app.use("/api/user/transaction/", Transaction);
  app.use("/admin" , Admin)
};

export default Routes;

