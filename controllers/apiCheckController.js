const connection = require("../db");

const handleApiCheck = (req, res) => {
  const cookies = req.cookies;
  const api = req.query.api;
  console.log("cookies", cookies?.jwt?.jwt, "api", api);
  if (!cookies?.jwt?.jwt) return res.sendStatus(401);
  const refreshToken = cookies.jwt;

  try {
    const sqlTokenCreate = {
      sql: `CALL token_user_id_get('${refreshToken.jwt}')`,
      nestTables: true,
    };
    console.log(` handleApiCheck CALL token_user_id_get('${refreshToken.jwt}')`);

    connection.query(sqlTokenCreate, (err, result) => {
      if (err) {
        console.error("Err to get Userid from token: " + err.message);
        return res.sendStatus(504);
      } else {
        // console.log(JSON.parse(JSON.stringify(result[0]))[0][""].token_data);
        console.log(
          "handleApiCheck получено id user on token",
          JSON.parse(JSON.stringify(result[0]))[0]
        );
        if (
          JSON.parse(JSON.stringify(result[0]))[0][""]["user_ident"] === null
        ) {
          return res.sendStatus(401);
        } else {
          console.log(
            "callll",
            `CALL api_check('${
              JSON.parse(JSON.stringify(result[0]))[0][""]["user_ident"]
            },${api}')`
          );
          const sqlApi_check = {
            sql: `CALL api_check(${
              JSON.parse(JSON.stringify(result[0]))[0][""]["user_ident"]
            },'${api}')`,
            nestTables: true,
          };

          connection.query(sqlApi_check, (err, result) => {
            if (err) {
              console.error("Err to get Userid from token: " + err.message);
              return res.sendStatus(504);
            } else {
              // console.log(JSON.parse(JSON.stringify(result[0]))[0][""].token_data);
              console.log(
                "получено доступ api",
                JSON.parse(JSON.stringify(result[0]))[0][""]["user_api"]
              );
              if (
                JSON.parse(JSON.stringify(result[0]))[0][""]["user_api"] ===
                undefined
              ) {
                return res.sendStatus(403);
              } else {
                res.json(
                  JSON.parse(JSON.stringify(result[0]))[0][""]["user_api"]
                );
              }
            }
          });
        }
      }
    });
  } catch (err) {
    console.error("Error message: ", err);
    res.send("Ошибка входа");
  }
};

module.exports = { handleApiCheck };
