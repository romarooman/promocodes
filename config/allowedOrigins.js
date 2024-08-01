const path = require("path");
require("dotenv").config({
  path: path.relative(process.cwd(), path.join(__dirname, ".env")),
});

const allowedOrigins = [
  process.env.corshost,
  "http://192.168.1.226:3000",
  "http://192.168.1.226:3001",
  "http://92.53.111.209:3001",
  'http://127.0.0.1:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3001',
  'http://localhost:3001'
];

module.exports = allowedOrigins;
