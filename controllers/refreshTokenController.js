const connection = require("../db");

const jwt = require("jsonwebtoken");
require("dotenv").config();

const handleRefreshToken = (req, res) => {
  const cookies = req.cookies;
  console.log("handleRefreshToken cookies", cookies);
  if (!cookies?.jwt?.jwt) return res.sendStatus(401);
  const refreshToken = cookies.jwt;

  try {
    const sqlTokenCreate = {
      sql: `CALL token_user_id_get('${refreshToken.jwt}')`,
      nestTables: true,
    };

    connection.query(sqlTokenCreate, (err, result) => {
      if (err) {
        console.error("Err to get Userid from token: " + err.message);
        return res.sendStatus(504);
      } else {
        // console.log(JSON.parse(JSON.stringify(result[0]))[0][""].token_data);
        console.log(
          " handleRefreshToken получено id user on token",
          JSON.parse(JSON.stringify(result[0]))[0]
        );
        if (
          JSON.parse(JSON.stringify(result[0]))[0][""]["user_ident"] === null
        ) {
          return res.sendStatus(403);
        } else {
          // const accessToken = jwt.sign(
          //   { username: JSON.parse(JSON.stringify(result[0]))[0]["users"] },
          //   JSON.parse(JSON.stringify(result[0]))[0][""].token_data
          // );

          // const accessToken = {
          //   username: JSON.parse(JSON.stringify(result[0]))[0]["users"],
          //   jwt: JSON.parse(JSON.stringify(result[0]))[0][""].token_data,
          // };

          res.cookie("jwt", refreshToken, {
            httpOnly: true,
            secure: false,
            maxAge: 24 * 60 * 60 * 1000,
          });
          res.json({ refreshToken });
        }
      }
    });
  } catch (err) {
    console.error("Error message: ", err);
    res.send("Ошибка входа");
  }

  //   const foundUser = usersDB.users.find(
  //     (person) => person.refreshToken === refreshToken
  //   );
  //   if (!foundUser) return res.sendStatus(403); //Forbidden
  //   // evaluate jwt
  //   jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
  //     if (err || foundUser.username !== decoded.username)
  //       return res.sendStatus(403);
  //     const accessToken = jwt.sign(
  //       { username: decoded.username },
  //       process.env.ACCESS_TOKEN_SECRET,
  //       { expiresIn: "30s" }
  //     );
  //     res.json({ accessToken });
  //   });
};

module.exports = { handleRefreshToken };
