import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";
import https from "https";
import http from "http";
import fs from "fs";
import Secrets from "./config/secrets.js";
import Routes from "./routes/index.js";
import "./cron/remaining_balance_from_used.js";
import session from "express-session";
import path from "path";

dotenv.config();

const app = express();

// Middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cors());
app.use(morgan("dev"));
app.use(
  session({
    secret: "RANDOM_KEY!@#$%^&*", // Replace with a strong, unique key
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Set to true for HTTPS
      maxAge: 60 * 60 * 1000, // 1 hour expiration
    },
  })
);


// Authentication Middleware
function isAuthenticated(req, res, next) {
  // Check if the request path starts with /admin-user-panel
  if (req.path.startsWith("/admin-user-panel") || req.path.startsWith("/admin") ) {
    if (req.session && req.session.isLoggedIn) {
      if(req.path.startsWith("/admin-user-panel/login"))
        {
         return res.redirect("/admin-user-panel");
        }else{
          return next();
        }
    } 
    else if(req.path.startsWith("/admin-user-panel/assets") || req.path.startsWith("/admin-user-panel/login"))
    {
      return next();
    }
    else {
      return res.redirect("/admin-user-panel/login.html");
    }
  }
  // For all other routes, proceed without authentication
  next();
}
app.use(isAuthenticated);



app.post("/admin-user-panel/login", (req, res) => {
  const { username, password } = req.body;

  // Hardcoded credentials (Replace with a secure system in production)
  const ADMIN_USERNAME = "1"; // Replace with actual username
  const ADMIN_PASSWORD = "1"; // Replace with actual password

  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isLoggedIn = true;
    // console.log("Login successful, session set:", req.session); // Log session on successful login
    res.redirect("/admin-user-panel");
  } else {
    res.status(401).send("Invalid credentials. <a href='/login'>Try again</a>");
  }
  
});

// Logout Route
app.get("/admin-user-panel/logout", (req, res) => {
  req.session.destroy();
  res.send("Logged out. <a href='/login'>Login again</a>");
});

// Health Check Route
app.get("/", (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: `Server is Running`,
    });
  } catch (error) {
    console.log({ error });
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

// Routes
Routes(app);



// SSL Setup (Optional, for HTTPS)
// const sslOptions = {
//   key: fs.readFileSync("../../ssl/private/dev.rxddapps.com.key"), // Path to private key
//   cert: fs.readFileSync("../../ssl/cert/dev.rxddapps.com.crt"), // Path to certificate
//   ca: fs.readFileSync("../../ssl/cert/dev.rxddapps.com-ca.crt"), // Path to CA bundle
// };

// Serve static files for /admin-user-panel
app.use('/admin-user-panel', express.static(path.join(path.resolve(), "public")));

// Create HTTPS Server (Optional)
const PORT = Secrets?.PORT || 5001;

// Uncomment below line if you want to use HTTPS
// https.createServer(sslOptions, app).listen(PORT, () => {
//   console.log(`Secure Server Running on port ${PORT}`);
// });

const server = http.createServer(app);
server.listen(
  PORT,
  console.log(`Server Running ${Secrets.node_ENV} mode in ${PORT}`)
);
