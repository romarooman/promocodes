const DATE_BASE = {
    db: {
      connectionLimit: +process.env.connectionLimit,
      connectTimeout: +process.env.connectTimeout,
      acquireTimeout: +process.env.acquireTimeout,
      timeout: +process.env.timeout,
      host: process.env.host,
      user: process.env.user,
      password: process.env.password,
      database: process.env.database,
      waitForConnections: Boolean(process.env.waitForConnections),
      queueLimit: +process.env.queueLimit,
      timezone: process.env.timezone,
    },
    path: {
      uploadProd: process.env.uploadProd,
      pathDev: process.env.pathDev,
    },
  };
  
  module.exports = DATE_BASE;
