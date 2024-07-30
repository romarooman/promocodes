const path = require("path");
require("dotenv").config({
  path: path.relative(process.cwd(), path.join(__dirname, ".env")),
});

const express = require("express");
const session = require("express");
const bodyParser = require("body-parser");
const { logger } = require("./middleware/logEvents");
const errorHandler = require("./middleware/errorHandler");
const cors = require("cors");
const corsOptions = require("./config/corsOptions");
const cookieParser = require("cookie-parser");
const credentials = require("./middleware/credentials");
const bcrypt = require("bcrypt");
const crypto = require("crypto");

const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const app = express();
const pid = process.pid;

const PORT = process.env.tcpport;

app.set("trust proxy", 1);
app.use(
  session({
    cookie: { secure: false },
  })
);

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  secure: true,
  auth: {
    user: "rskira9@gmail.com",
    pass: "zpvn cvfx hkcb vfug",
  },
});

app.use(cookieParser());
app.use(credentials);
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(express.urlencoded({ extended: false }));
app.use(express.json({ extended: true }));

const connection = require("./db");
const { log } = require("console");

app.use(logger);
app.use(errorHandler);
app.use("/auth", require("./routes/auth"));
app.use("/refresh", require("./routes/refresh"));
app.use("/logout", require("./routes/logout"));
app.use("/apicheck", require("./routes/apicheck"));

app.post("/api/reguser", async (req, res) => {
  const { username, email, password, role = "user" } = req.body;

  try {
    const checkSql = "SELECT * FROM users WHERE username = ?";
    connection.query(checkSql, [email], (err, results) => {
      if (err) {
        console.error("Database error:", err);
        return res.status(500).json({ message: "Database connection error" });
      }

      if (results.length > 0) {
        return res.status(409).json({ message: "User already exists" });
      }

      const sql = `CALL registration (?, ?, ?, ?)`;
      console.log(sql, [username, email, password, 1]);
      connection.query(sql, [username, email, password, 1], (err, result) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ message: "Database connection error" });
        }

        const userid = JSON.parse(JSON.stringify(result[0]))[0]?.insert_id;
        const code = Math.random().toString(36).substring(2, 10);
        const linkSql = "CALL UserCodesInsert(?, ?)";
        console.log(linkSql, [userid, code]);
        connection.query(linkSql, [userid, code], (err) => {
          if (err) {
            console.error("Database error:", err);
            return res
              .status(500)
              .json({ message: "Database connection error" });
          }
          console.log(`CALL api_list('${userid}')`);
          const sqlTokenCreate = {
            sql: `CALL token_create('${userid}','${49}')`,
            nestTables: true,
          };

          const sqlSelect = {
            sql: `CALL api_list('${userid}')`,
            nestTables: true,
          };
          console.log(sqlSelect);
          connection.query(sqlSelect, (err, result) => {
            if (err) {
              console.error(
                "error connection: ",
                err,
                "Тип ошибки: ",
                err.syscall
              );
            } else {
              console.log("список reports list");
              let api_list = result;
              console.log(sqlTokenCreate);
              connection.query(sqlTokenCreate, (err, result) => {
                if (err) {
                  console.error("Err from callback: " + err.message);
                  return res.sendStatus(500);
                } else {
                  console.log(
                    JSON.parse(JSON.stringify(result[0]))[0][""].token_data
                  );

                  const accessToken = {
                    username: username,
                    api_list: api_list[0],
                    code: code,
                    jwt: JSON.parse(JSON.stringify(result[0]))[0][""]
                      .token_data,
                  };

                  res.cookie("jwt", accessToken, {
                    httpOnly: true,
                    secure: false,
                    maxAge: 24 * 60 * 60 * 1000,
                  });
                  res.json({ accessToken });
                }
              });
            }
          });

          // res
          //   .status(201)
          //   .json({ message: "User registered successfully", code });
        });
      });
    });
  } catch (err) {
    console.error("Unexpected error:", err);
    res.status(500).json({ message: "Unexpected error" });
  }
});

app.get("/api/codes", (req, res) => {
  const sql = "SELECT id,code FROM UserCodes";
  connection.query(sql, (err, results) => {
    if (err)
      return res.status(500).json({ message: "Database error", error: err });
    res.json(results);
  });
});

app.get("/api/orderslist/:unique_code", (req, res) => {
  const { unique_code } = req.params;

  const sql = `
      SELECT Orders.order_number, Orders.price
      FROM Orders
      JOIN UserCodes ON Orders.user_code_id = UserCodes.id
      WHERE UserCodes.code = ?
  `;
  connection.query(sql, [unique_code], (err, results) => {
    if (err)
      return res.status(500).json({ message: "Database error", error: err });
    res.json(results);
  });
});

app.post("/api/createorderspromo", (req, res) => {
  console.log(req.body);
  const { code, orderNumber, price } = req.body;
  console.log(code, orderNumber, price);
  const orderSql =
    "INSERT INTO Orders (user_code_id, order_number, price) VALUES (?, ?, ?)";
  connection.query(orderSql, [code, orderNumber, price], (err, result) => {
    if (err) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({ message: "Order number already exists" });
      }
      return res.status(500).json({ message: "Database error", error: err });
    }
    res.json({ id: result.insertId });
  });
});

// Endpoint to request password reset
app.post("/requestreset", (req, res) => {
  const { email } = req.body;
  const token = crypto.randomBytes(20).toString("hex");

  // Check if the email exists in the database
  connection.query(
    "SELECT * FROM users WHERE username = ?",
    [email.toUpperCase()],
    (err, result) => {
      if (err) throw err;
      if (result.length === 0) {
        return res.status(400).send("Email does not exist");
      }

      // Save the token in the database with an expiration date
      const expirationDate = Date.now() + 3600000; // 1 hour
      connection.query(
        "UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE username = ?",
        [token, expirationDate, email],
        (err, result) => {
          if (err) console.log(err);
          console.log([token, expirationDate, email]);
          // Send the email
          const mailOptions = {
            to: email,
            from: '"The Idea project" <rskira9@gmail.com>',
            subject: "Password Reset",
            text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n\n
        http://localhost:3000/reset/${token}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`,
          };

          transporter.sendMail(mailOptions, (err, response) => {
            if (err) console.log(err);
            res.status(200).send("Recovery email sent");
          });
        }
      );
    }
  );
});

//----------------------------------------------------------------------------------------------------------------------------------------------------------------
// Endpoint to reset the password
app.post("/resett/:token", (req, res) => {
  const { token } = req.params;
  const { cryp } = req.body;
  console.log('req.body',req.body);

  connection.query(
    "SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires > ?",
    [token, Date.now()],
    (err, result) => {
      console.log("result", result);
      if (err) console.log(err);
      if (result.length === 0) {
        return res
          .status(400)
          .send("Password reset token is invalid3 or has expired");
      }

      // Update the password
      connection.query(
        "UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE reset_password_token = ?",
        [cryp, token],
        (err, result) => {
          if (err) throw err;
          res.status(200).send("Password has been reset");
        }
      );
    }
  );
});

app.use("/upload", express.static(path.join(__dirname, "upload")));
app.use(express.static(path.join(__dirname, "build")));

// app.all('*', (req, res) => {
//   res.status(404);
//   if (req.accepts('html')) {
//       res.sendFile(path.join(__dirname, 'views', '404.html'));
//   } else if (req.accepts('json')) {
//       res.json({ "error": "404 Not Found" });
//   } else {
//       res.type('txt').send("404 Not Found");
//   }
// });

app.get("*", (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.sendFile(path.join(__dirname, "build/index.html"), function (err) {
    if (err) {
      res.status(500).send(err);
    }
  });
});

app.use(bodyParser.urlencoded({ extended: true }));

app.listen(PORT, () => {
  console.log(`Runniog on port ${PORT}, Pid: ${pid}`);
});
