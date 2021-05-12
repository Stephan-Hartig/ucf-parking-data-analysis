import dayjs = require('dayjs');
import utc = require('dayjs/plugin/utc');
import timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * The result of a SQL query on `GARAGE_MONITOR_DATA`.
 */
export type ParkingRecordNative = {
   GarageID:  number,
   Available: number,
   Capacity:  number,
   Timestamp: Date
};


/**
 * 'YYYY-MM-DD HH:mm:ss' and in eastern-time (EST).
 */
export type ESTstring = string;

/**
 * 'YYYY-MM-DD HH' and in eastern-time (EST).  
 */
export type Datehour = string;

/**
 * This is basically what we store in the database. Similar to
 * `ParkingRecordNative` but with lowercase fields and field `timestamp`
 * is changed to type `string` at EST timezone.
 *
 * @prop {string} name              Name of the garage. Might be changed to an enum type in the future because it should be the exact name of the garage as found in the db.
 * @prop {number} available         Number of available parking spots.
 * @prop {number} capacity          Parking capacity of the garage.
 * @prop {string} timestamp         'YYYY-MM-DD HH:ss:mm' and in EST.
 */
export type ParkingRecord = {
   garageId:   number,
   available:  number,
   capacity:   number,
   timestamp:  ESTstring
};

/**
 * Typegaurd.
 */
export function isParkingRecordNative(record: any): record is ParkingRecordNative {
   return typeof record.GarageID === 'number'
      && typeof record.Available === 'number'
      && typeof record.Capacity  === 'number'
      && record.Timestamp instanceof Date;
}

/**
 * Typeguard.
 * 
 * NOTE: Only use if confident all entries in the array are the same type, e.g.,
 * a SQL query will always return a homogeneously typed array.
 * NOTE: Also, can't be an empty array.
 */
export function isParkingRecordNatives(records: any): records is ParkingRecordNative[] {
   return Array.isArray(records) && records.length > 0 && isParkingRecordNative(records[0]);
}

/**
 * Typeguard.
 */
export function isParkingRecord(record: any): record is ParkingRecord {
   return typeof record.garageId === 'number'
      && typeof record.available === 'number'
      && typeof record.capacity  === 'number'
      && typeof record.timestamp === 'string';
}

/**
 * Typeguard.
 * 
 * NOTE: Only use if confident all entries in the array are the same type, e.g.,
 * a SQL query will always return a homogeneously typed array.
 * NOTE: Also, can't be an empty array.
 */
export function isParkingRecords(records: any): records is ParkingRecord[] {
   return Array.isArray(records) && records.length > 0 && isParkingRecord(records[0]);
}

/**
 * Convert a date object (UTC) into an eastern-time (EST) string representation.
 *
 * @param {Date} date   Javascript Date object.
 * @return {string}     'YYYY-MM-DD HH:mm:ss'.
 */
export function castUTCtoEST(date: Date): ESTstring {
   return dayjs(date).tz('US/Eastern').format('YYYY-MM-DD HH:mm:ss');
}

/**
 * Convert an eastern-time (EST) string into a unix timestamp.
 *
 * @param {ESTstring} date    'YYYY-MM-DD HH:mm:ss' and in EST.
 * @return {number}           Unix timestamp (precise to whole seconds NOT milli/nano).
 */
export function castESTtoUnix(date: ESTstring): number {
   return dayjs.tz(date, 'US/Eastern').unix();
}

/**
 * Convert an datehour string into a unix timestamp.
 * @param {Datehour} date     'YYYY-MM-DD HH' aka NO ':mm:ss' and in EST.
 * @return {number}           Unix timestamp (precise to whole seconds NOT milli/nano).
 */
export function castDatehourtoUnix(datehour: Datehour): number {
   return dayjs.tz(datehour + ':00:00', 'US/Eastern').unix();
}

/**
 * Convert a date object (UTC) into an eastern-time (EST) string representation.
 *
 * @param {Date} date   Javascript Date object.
 * @return {string}     'YYYY-MM-DD HH', i.e., no minutes/seconds.
 */
export function castUTCtoDatehour(date: Date): Datehour {
   return dayjs(date).tz('US/Eastern').format('YYYY-MM-DD HH');
}

/**
 * Convert a(n EST) datetime string into a datehour string.
 *
 * @param {string} date       Datetime in form 'YYYY-MM-DD HH:mm:ss'.
 * @return {string}           'YYYY-MM-DD HH', i.e., no minutes/seconds.
 */
export function castESTtoDatehour(date: ESTstring): Datehour {
   return date.slice(0, 13);
}

/**
 * Cast ParkingRecordNative to ParkingRecord, which are basically the same type
 * but with different capitalization for the field names.
 * NOTE: Field `timestamp` is changed to type `string` at EST timezone.
 */
export function castParkingRecordFromNative(record: ParkingRecordNative): ParkingRecord {
   return {
      garageId:   record.GarageID,
      available:  record.Available,
      capacity:   record.Capacity,
      timestamp:  castUTCtoEST(record.Timestamp)
   };
}


export type GarageRecordNative = {
   ID:   number,
   Name: string
};
/**
 * Typeguard.
 */
export function isGarageRecordNative(record: any): record is GarageRecordNative {
   return typeof record.ID === 'number'
      && typeof record.Name === 'string';
}
/**
 * Typeguard.
 * 
 * NOTE: Only use if confident all entries in the array are the same type, e.g.,
 * a SQL query will always return a homogeneously typed array.
 * NOTE: Also, can't be an empty array.
 */
export function isGarageRecordNatives(records: any): records is GarageRecordNative[] {
   return Array.isArray(records) && records.length > 0 && isGarageRecordNative(records[0]);
}


export type GarageRecord = {
   id:   number,
   name: string
};

/**
 * Typeguard.
 */
export function isGarageRecord(record: any): record is GarageRecordNative {
   return typeof record.id === 'number'
      && typeof record.name === 'string';
}
/**
 * Typeguard.
 * 
 * NOTE: Only use if confident all entries in the array are the same type, e.g.,
 * a SQL query will always return a homogeneously typed array.
 * NOTE: Also, can't be an empty array.
 */
export function isGarageRecords(records: any): records is GarageRecord[] {
   return Array.isArray(records) && records.length > 0 && isGarageRecord(records[0]);
}

/**
 * Cast GarageNative to Garage, which are basically the same type
 * but with different capitalization for the field names.
 */
export function castGarageRecordFromNative(record: GarageRecordNative): GarageRecord {
   return {
      id:   record.ID,
      name: record.Name
   };
}


