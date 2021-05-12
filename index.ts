import mysql = require('mysql');
import dotenv = require('dotenv');
//import norm = require('./normalize-parking');
import norm = require('./update-normalize-parking');

dotenv.config();



let conn = mysql.createConnection({
   host:       process.env.DB_HOST,
   user:       process.env.DB_USER,
   password:   process.env.DB_PASSWORD,
   database:   process.env.DB_DATABASE
});

conn.connect(async e => {
   if (e) throw e;
   
   console.log('Analysis server up and running.');

   // Either externally schedule this program as an hourly job, or add some setInterval logic.
   norm.createAllNorms(conn);
});
