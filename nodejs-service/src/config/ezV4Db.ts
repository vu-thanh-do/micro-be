import sql from "mssql";
import { Sequelize, DataTypes } from "sequelize";

const sqlConfig = {
  user: process.env.USERNAME_SQL,
  password: process.env.PASSWORD_SQL,
  server: process.env.SERVER_SQL,
  database: process.env.NAME_DB_SQL,
  options: {
    encrypt: true, //
    trustServerCertificate: true, //
    Trusted_Connection: true,
    MultipleActiveResultSets: true,
    enableArithAbort: true
  },
} as any;
const ConnectSqlServer = async () => {
  try {
    await sql.connect(sqlConfig);
    console.log("Connected sql server"); // connected
  } catch (err) {
    console.error("Error connecting to SQL Server:", err);
  }
};
const sequelizeSql = new Sequelize({
  dialect: "mssql",
  host: process.env.SERVER_SQL,
  username: process.env.USERNAME_SQL,
  password: process.env.PASSWORD_SQL,
  database: process.env.NAME_DB_SQL,
  dialectOptions: {
    encrypt: false, // Đảm bảo sử dụng mã hóa
    trustServerCertificate: true, // Chấp nhận chứng chỉ không hợp lệ nếu cần
  },
});

export { ConnectSqlServer, sequelizeSql };
