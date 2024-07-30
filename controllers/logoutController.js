const connection = require("../db");

const handleLogout = async (req, res) => {
  const cookies = req.cookies;
  if (!cookies?.jwt) return res.sendStatus(204); //No content
  const refreshToken = cookies.jwt;

  try {
    const sqlTokenCreate = {
      sql: `CALL token_user_id_get('${refreshToken.jwt}')`,
      nestTables: true,
    };

    connection.query(sqlTokenCreate, (err, result) => {
      if (err) {
        console.error("Err from callback1: " + err.message);
        res.clearCookie("jwt", {
          httpOnly: true,
          secure: false,
        });
        return res.sendStatus(504);
      } else {
        if (JSON.parse(JSON.stringify(result[0]))[0][""]["user_ident"]) {
          let user_id = JSON.parse(JSON.stringify(result[0]))[0][""]["user_ident"];
          const token_destroy = {
            sql: `CALL token_destroy('${user_id}')`,
            nestTables: true,
          };
          connection.query(token_destroy, (err, result) => {
            if (err) {
              console.error("Err from callback2: " + err.message);
              res.send("Нет соединение с БД");
            } else {
              console.log("удаление token");
              res.clearCookie("jwt", {
                httpOnly: true,
                secure: false,
              });
              return res.sendStatus(204);
            }
          });
        } else {
          res.clearCookie("jwt", {
            httpOnly: true,
            secure: false,
          });
          return res.sendStatus(204);
        }
      }
    });
  } catch (err) {
    console.error("Error message: ", err);
    res.send("Ошибка входа");
  }
};

module.exports = { handleLogout };
