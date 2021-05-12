import mysql = require('mysql');
import dayjs = require('dayjs');
import utc = require('dayjs/plugin/utc');
import timezone = require('dayjs/plugin/timezone');

import db = require('./db-types');

dayjs.extend(utc);
dayjs.extend(timezone);



/**
 * Get the earliest timestamp from GARAGE_MONITOR_DATA.
 * 
 * @param {mysql.Connection} conn   The connection to the mysql database.
 * @return {Promise<ESTstring>}     The earliest timestamp.
 */
export async function getMinTimestamp(conn: mysql.Connection): Promise<db.ESTstring> {
   return new Promise<db.ESTstring>(async (resolve, reject) => {
      try {
         const sql = `
            select * from GARAGE_MONITOR_DATA
            order by TIMESTAMP asc
            limit 1;
         `;
         conn.query(sql, (e, res) => {
            if (e) throw e;

            if (db.isParkingRecordNatives(res))
               resolve(db.castUTCtoEST(res[0].Timestamp));
            else
               throw new Error('Error: Somehow MySQL query result `res` is not typeof `ParkingRecordNative[]`.');
         });
      }
      catch (e) {
         reject(e);
      }
   });
}

/**
 * Get the latest timestamp from GARAGE_MONITOR_DATA.

 * @param {mysql.Connection} conn   The connection to the mysql database.
 * @return {Promise<ESTstring>}     The latest timestamp.
 */
export async function getMaxTimestamp(conn: mysql.Connection): Promise<db.ESTstring> {
   return new Promise<db.ESTstring>(async (resolve, reject) => {
      try {
         const sql = `
            select * from GARAGE_MONITOR_DATA
            order by TIMESTAMP desc
            limit 1;
         `;
         conn.query(sql, (e, res) => {
            if (e) throw e;

            if (db.isParkingRecordNatives(res))
               resolve(db.castUTCtoEST(res[0].Timestamp));
            else
               throw new Error('Error: Somehow MySQL query result `res` is not typeof `ParkingRecordNative[]`.');
         });
      }
      catch (e) {
         reject(e);
      }
   });
}

/**
 * Get the list of garages from table GARAGES.
 * 
 * @param {mysql.Connection} conn            The connection to the mysql database.
 * @return {Promise<db.GarageRecord[]>}      The list of all garages.
 */
export async function getGarages(conn: mysql.Connection): Promise<db.GarageRecord[]> {
   return new Promise<db.GarageRecord[]>((resolve, reject) => {
      try {
         const sql = `select * from GARAGES;`;
         conn.query(sql, (e, res) => {
            if (e) throw e;
            if (db.isGarageRecordNatives(res) || res.length == 0)
               resolve((res as db.GarageRecordNative[]).map(db.castGarageRecordFromNative));
            else
               throw new Error('Error: Somehow MySQL query result `res` is not typeof `GarageRecordNative[]`.');
         });
      }
      catch (e) {
         reject(e);
      }
   });
}

/**
 * Get all the parking data for specific garage, hour, and date.
 *
 * @param {mysql.Connection} conn   The connection to the mysql server.
 * @param {number} garageId         A valid primary key from the mysql table.
 * @param {db.Datehour} datehour    Should be string of form 'YYYY-MM-DD HH'.
 * 
 * @return {Promise<ParkingRecord[]>}  Array of parking records in that hour.
 */
export async function getGarageDatehourData(conn: mysql.Connection, garageId: number, datehour: db.Datehour): Promise<db.ParkingRecord[]> {
   return new Promise<db.ParkingRecord[]>((resolve, reject) => {
      try {
         const lowerbound = dayjs.tz(datehour + ':00:00', 'US/Eastern').unix();
         const upperbound = dayjs.tz(datehour + ':59:59', 'US/Eastern').unix();
         const sql = `
            select * from GARAGE_MONITOR_DATA
            where
               GARAGEID = ${mysql.escape(garageId)}
               and TIMESTAMP >= from_unixtime(${mysql.escape(lowerbound)})
               and TIMESTAMP <= from_unixtime(${mysql.escape(upperbound)});
         `;
         conn.query(sql, (e, res) => {
            if (e) throw e;

            // At this time `isParkingRecord*()` doesn't accept empty arrays by design,
            // so manually cast when empty.
            if (db.isParkingRecordNatives(res) || res.length == 0)
               resolve((res as db.ParkingRecordNative[]).map(db.castParkingRecordFromNative));
            else
               throw new Error('Error: Somehow MySQL query result `res` is not typeof `ParkingRecordNative[]`.');
         });
      }
      catch (e) {
         reject(e);
      }
   });
}


/**
 * Get all the parking data for all garages at a specific hour and date.
 *
 * @param {mysql.Connection} conn   The connection to the mysql server.
 * @param {db.Datehour} datehour    Should be string of form 'YYYY-MM-DD HH'.
 * 
 * @return {Promise<ParkingRecord[]>}  Array of parking records in that hour.
 */
export async function getGaragesDatehourData(conn: mysql.Connection, datehour: db.Datehour): Promise<db.ParkingRecord[]> {
   return new Promise<db.ParkingRecord[]>(async (resolve, reject) => {
      try {
         const garages = await getGarages(conn);
         let data: db.ParkingRecord[] = [];
         for (const garage of garages) {
            data.concat(await getGarageDatehourData(conn, garage.id, datehour));
         }
         resolve(data);
      }
      catch (e) {
         reject(e);
      }
   });
}

/**
 * Returns the rounded average of an ParkingRecord[] 's availability.
 *
 * @param {ParkingRecord[]} values     Array of parking records.
 * @return {number}                    Average availability.
 */
export function averageAvailability(values: db.ParkingRecord[]): number {
   if (values.length > 0)
      return ~~(values.map(val => val.available).reduce((a, b) => a + b) / values.length);
   else
      throw new Error('Cannot take average of empty array.');
}


/**
 * Used for when there's not enough datapoints to run a proper analysis.
 */
export class InsufficientDatapointsError extends Error {
   constructor(message: string) {
      super(message);
      this.name = this.constructor.name;
   }
}
//export function InsufficientDatapointsError(this: Error, message: string) {
//   this.name = 'InsufficientDatapointsError';
//   this.message = message;
//   this.stack = (new Error()).stack;
//}
//InsufficientDatapointsError.prototype = new Error;


export const MIN_GARAGES_ALLOWED = 5;

/**
 * From the GARAGE_MONITOR_DATA db, generate a normalized datapoint for a specific hour and garage.
 * 
 * @description
 * The normalization is simply the average across the hour. Always will return
 * a datapoint where the minutes and seconds of the timestamp are exactly zero.
 *
 * @param {mysql.Connection} conn      The connection to the mysql server.
 * @param {number} garageId            A valid primary key from the mysql table.
 * @param {db.Datehour} datehour       'YYYY-MM-DD HH', i.e., a timestamp WITHOUT minutes and seconds.
 * @param {number} minGarages?         Throw an error if we don't have this many data points for the hour.
 *
 * @throws {InsufficientDatapointsError}     When there isn't enough data for the hour. See also `param minGarages`.
 */
export async function generateNorm(conn: mysql.Connection, garageId: number, datehour: db.Datehour, minGarages: number = MIN_GARAGES_ALLOWED): Promise<db.ParkingRecord> {
   const data = await getGarageDatehourData(conn, garageId, datehour);
   if (data.length < minGarages)
      throw new InsufficientDatapointsError(`minGarages = ${minGarages} but data.length = ${data.length}`);
   
   return {
      garageId: garageId,
      available: averageAvailability(data),
      capacity: data[0].capacity,
      timestamp: (datehour + ':00:00') as db.ESTstring
   };
}

/**
 * Retrieve a record from table NORMALIZED_PARKING_DATA. Can use this instead of `existsNorm`.
 *
 * @param {mysql.Connection} conn         The connection to the mysql server.
 * @param {number} garage                 The id of the garage as found in table GARAGES.
 * @param {db.Datehour} datehour          The 'YYYY-MM-DD HH' timetamp of the garage.
 * 
 * @return {db.ParkingRecord | null}      Not sure if allowing null is good practice.
 */
export async function getNorm(conn: mysql.Connection, garageId: number, datehour: db.Datehour): Promise<db.ParkingRecord|null> {
   // Am I committing a sin? Does this violate best null-saftey practices?
   return new Promise<db.ParkingRecord|null>((resolve, reject) => {
      try {
         const sql = `
               select * from NORMALIZED_PARKING_DATA
               where
                  GARAGEID = ${mysql.escape(garageId)}
                  and TIMESTAMP = ${mysql.escape(datehour + ':00:00')};
         `;
         conn.query(sql, (e, res) => {
            if (e) throw e;
            
            if (res.length == 0)
               resolve(null);
            else if (res.length == 1)
               resolve(res[0]);
            else
               throw new Error('Too many results found from SQL query.');
         });
      }
      catch (e) {
         reject(e);
      }
   });
}

/**
 * Check if a normalized record already exists at NORMALIZED_PARKING_DATA db.
 * 
 * @param {mysql.Connection} conn         The connection to the mysql database.
 * 
 * First form is `existsNorm(conn, garageId: number, datehour: string)`
 * | Query NORMALIZED_PARKING_DATA using `garageId` and `datehour`.
 *
 * @param {number} garage                 The id of the garage as found in table GARAGES.
 * @param {db.Datehour} datehour          The 'YYYY-MM-DD HH' timetamp of the garage.
 *
 * Second form is `existsNorm(conn, normRecord: ParkingRecord)`
 * | Extracts the garageId and datehour from normalized record `normRecord`. Does NOT care about `.capacity` and `.available` fields.
 * 
 * @param {db.ParkingRecord} garage       A record with the same garage id and datehour as the slot we care about in the database.
 *
 * @return {Promise<boolean>}             Whether or not such a record exists in the db.
 */
export async function existsNorm(conn: mysql.Connection, garage: db.ParkingRecord | number, datehour?: db.Datehour): Promise<boolean> {
   return new Promise<boolean>(async (resolve, reject) => {
      try {
         if (typeof garage === 'number') {
            const sql = `
               select * from NORMALIZED_PARKING_DATA
               where
                  GARAGEID = ${mysql.escape(garage)}
                  and TIMESTAMP = ${mysql.escape(datehour + ':00:00')};
            `;
            conn.query(sql, (e, res) => {
               if (e) throw e;

               resolve(res.length > 0);
            });
         }
         else {
            resolve(await existsNorm(conn, garage.garageId, db.castESTtoDatehour(garage.timestamp)));
         }
      }
      catch (e) {
         reject(e);
      }
   });
}

/**
 * Put a normalized record into the NORMALIZED_PARKING_DATA db.
 * Call `existsNorm()` before calling this function.
 *
 * @param {mysql.Connection} conn         The connection to the mysql database.
 * @param {db.ParkingRecord} record       The record to put into the database.
 * @async
 */
export async function putNorm(conn: mysql.Connection, record: db.ParkingRecord) {
   return new Promise<void>((resolve, reject) => {
      try {
         const sql = `
            insert into NORMALIZED_PARKING_DATA (GARAGEID, AVAILABLE, CAPACITY, TIMESTAMP)
            values
            (
               ${mysql.escape(record.garageId)},
               ${mysql.escape(record.available)},
               ${mysql.escape(record.capacity)},
               from_unixtime(${mysql.escape(db.castESTtoUnix(record.timestamp))})
            );
         `;
         conn.query(sql, (e) => {
            if (e) throw e;

            resolve();
         });
      }
      catch (e) {
         reject(e);
      }
   });
}

