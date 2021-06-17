import mysql = require('mysql');
import dotenv = require('dotenv');
import norm = require('./update-normalize-parking');
import cron = require('node-cron');

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

   // Hourly service.
   console.log('Hourly service set for **:01.');
   let hourly = cron.schedule('1 * * * *', () => {
      console.log('Hourly service starting:');
      norm.createRecentNorms(conn);
   });

   // Weekly service.
   console.log('Weekly service set for Sundays at 1 am.');
   let weekly = cron.schedule('0 1 * * Sunday', () => {
      console.log('Weekly service starting:');
      norm.createAllNorms(conn);
   });
});
