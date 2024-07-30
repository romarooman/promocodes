const connection = require("../db");
const jwt = require("jsonwebtoken");

const handleLogin = async (req, res) => {
  try {
    console.log("логин пароль - принято", req.body);
    let { user, pwd } = req.body;
    const sqlCheckUser = {
      sql: `CALL checkUser('${user}','${pwd}')`,
      nestTables: true,
    };

    connection.query(sqlCheckUser, (err, result) => {
      console.log("Result from: ", result);
      if (err) {
        console.error("Err from callback: " + err.message);
        return res.sendStatus(500);
      } else if (!JSON.parse(JSON.stringify(result[0])).length) {
        res.sendStatus(401);
      } else {
        const firstname = JSON.parse(JSON.stringify(result[0]))[0]["users"][
          "firstname"
        ];
        console.log(
          "id user -- получено",
          JSON.parse(JSON.stringify(result[0]))[0]["users"]["firstname"],
          JSON.parse(JSON.stringify(result[0]))[0]["users"]
        );
        try {
          const sqlTokenCreate = {
            sql: `CALL token_create('${
              JSON.parse(JSON.stringify(result[0]))[0]["users"]["id"]
            }','${49}')`,
            nestTables: true,
          };

          const usercode = {
            sql: `SELECT code FROM UserCodes WHERE user_id = '${
              JSON.parse(JSON.stringify(result[0]))[0]["users"]["id"]
            }'`,
          };

          const sqlSelect = {
            sql: `CALL api_list('${
              JSON.parse(JSON.stringify(result[0]))[0]["users"]["id"]
            }')`,
            nestTables: true,
          };
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
              const api_list = result;
              connection.query(usercode, (err, result) => {
                if (err) {
                  console.error(
                    "error connection: ",
                    err,
                    "Тип ошибки: ",
                    err.syscall
                  );
                } else {
                  console.log(
                    "список reports list",
                    JSON.parse(JSON.stringify(result[0])),
                    JSON.parse(JSON.stringify(result[0]))?.code
                  );
                  const code = JSON.parse(JSON.stringify(result[0]))?.code;

                  connection.query(sqlTokenCreate, (err, result) => {
                    if (err) {
                      console.error("Err from callback: " + err.message);
                      return res.sendStatus(500);
                    } else {
                      console.log(
                        JSON.parse(JSON.stringify(result[0]))[0][""].token_data
                      );

                      const accessToken = {
                        username: firstname,
                        api_list: api_list[0],
                        code: code,
                        jwt: JSON.parse(JSON.stringify(result[0]))[0][""]
                          .token_data,
                      };
                      console.log("accessToken", accessToken);
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
            }
          });
        } catch (err) {
          console.error("Error message: ", err);
          res.send("Ошибка входа");
        }
      }
    });
  } catch (err) {
    console.error("Error message: ", err);
    res.send("Ошибка входа");
  }
};

module.exports = { handleLogin };
