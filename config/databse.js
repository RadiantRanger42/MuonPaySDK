import mysql from "mysql2";
import Secrets from "./secrets.js";

const pool = mysql.createPool({
  host: Secrets?.DB_HOST,
  user: Secrets?.DB_USER,
  password: Secrets?.DB_PASSWORD,
  database: Secrets?.DB_NAME,
  port: Secrets?.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const promisePool = pool.promise();
export default promisePool;
