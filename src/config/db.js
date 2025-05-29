const { Sequelize } = require('sequelize');

// connecting to pstgresql server
const sequelize = new Sequelize(
  process.env.DB_NAME,      // workspace_booking
  process.env.DB_USER,      // postgres
  process.env.DB_PASSWORD,  // password
  {
    host: process.env.DB_HOST, // localhost
    port: process.env.DB_PORT, // 5432
    dialect: 'postgres',
    logging: console.log, 
    timezone: '+05:30' //to convert to ist
  }
);

module.exports = sequelize;