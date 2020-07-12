var mysql = require('mysql');

// connection configurations
var dbConn = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});
  
// connect to database
dbConn.connect(); 

module.exports = dbConn;