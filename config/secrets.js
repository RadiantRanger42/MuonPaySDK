import dotenv from "dotenv";
dotenv.config();
import mysql from "mysql2";

const Secrets = {
  PORT: process.env.PORT,
  PRIVATE_KEY: process.env.PRIVATE_KEY,
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
  DB_PORT: process.env.DB_PORT,
  DEFAULT_ADDRESS: process.env.DEFAULT_ADDRESS,
  SEED_PHRASE: process.env.SEED_PHRASE,
  POSTBACK_URL : process.env.POSTBACK_URL
};


const pool1 = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const db = pool1.promise();


const [query_electrumx] = await db.query("SELECT * FROM `settings` WHERE name = 'electrumx_server_url' ");
Secrets.ELECTRUMX_URL = query_electrumx[0]['value'];

export default Secrets;
