const mysql = require("mysql");
const config = require("./services/configDB");

const database = mysql.createPool(config.db);

module.exports = {
  query: function () {
    let sql_args = [];
    let args = [];
    for (let i = 0; i < arguments.length; i++) {
      args.push(arguments[i]);
    }
    let callback = args[args.length - 1]; 
    database.getConnection(function (err, connection) {
      if (err) {
        console.log("Error from BD", err.message);
        return callback(err);
      }
      if (args.length > 2) {
        sql_args = args[1];
      }
      connection.query(args[0], sql_args, function (err, results) {
        connection.release(); 
        if (err) {
          console.log("Error from BD", err.message);
          return callback(err);
        }
        callback(null, results);
      });
    });
  },
};
