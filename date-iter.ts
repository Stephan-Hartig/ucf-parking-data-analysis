import db = require('./db-types');
import dayjs = require('dayjs');
import utc = require('dayjs/plugin/utc');
import timezone = require('dayjs/plugin/timezone');
dayjs.extend(utc);
dayjs.extend(timezone);

/**
 * Truncate the ':mm:ss' from the string.
 */
export function roundDown(datetime: db.ESTstring): db.Datehour {
   return db.castESTtoDatehour(datetime);
}

/**
 * Round up in ALL cases, ie even :00:00 rounds up. Returns with
 * no ':mm:ss'.
 */
export function dropUp(datetime: db.ESTstring): db.Datehour {
//   if (datetime.slice(13) === ':00:00')
   return dayjs.tz(datetime, 'US/Eastern').add(1, 'hour').format('YYYY-MM-DD HH');
}

/**
 * Generator for range of datetime between start (inclusive) and end (exclusive).
 */
export function* datehourRange(start: db.Datehour, end: db.Datehour) {
   let i = dayjs.tz(start, 'US/Eastern');
   const fin = dayjs.tz(end, 'US/Eastern');
   const inc = (i.diff(fin) > 0) ? -1 : 1;

   while (i.diff(fin) * inc * -1 > 0) {
      yield i.format('YYYY-MM-DD HH');
      i = i.add(inc, 'hour');
   }
}


