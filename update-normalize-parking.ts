import mysql = require('mysql');
import dates = require('./date-iter');
import norm = require('./normalize-parking');


/**
 * Create all possible rows in NORMALIZED_PARKING_DATA when they don't already exist.
 * This updates up to but NOT including the current hour!
 *
 * @param {mysql.Connection} conn      The connection to the mysql server.
 */
export async function createAllNorms(conn: mysql.Connection) {
   const lower = await norm.getMinTimestamp(conn);
   const upper = await norm.getMaxTimestamp(conn);
   
   console.log('lower=' + lower);
   console.log('upper=' + upper);

   const garages = await norm.getGarages(conn);

   for (const datehour of dates.datehourRange(dates.roundDown(lower), dates.roundDown(upper))) {
      console.log(datehour);
      for (const garage of garages) {
         try {
            if (!await norm.existsNorm(conn, garage.id, datehour))
               // First await is strictly not necessary methinks.
               await norm.putNorm(conn, await norm.generateNorm(conn, garage.id, datehour));
         }
         catch (e) {
            if (e instanceof norm.InsufficientDatapointsError)
               console.log('Insufficient datapoints, skip for now.');
            else {
               console.log('foobar');
               throw e;
            }
         }
      }
   }
}
