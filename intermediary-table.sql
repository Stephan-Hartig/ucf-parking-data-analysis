-- This table should contain the normalized parking data.
-- NOTE Column `datehour` will refer to a date + hour, as opposed to
-- date + time. It will likely be calculated via arith average. Also
-- see that it is of type datetime rather than timestamp.
create table NORMALIZED_PARKING_DATA (
   -- Columns.
   garageId    int not null references GARAGES(ID)
   datehour    timestamp not null,
   available   int not null,
   capacity    int not null,

   -- Constraints.
   primary key(garageId, datehour)
);

-- We might not use this table, but it is supposed to contain
-- extrapolations for hours that didn't have enough records for
-- whatever reason (e.g., server crashing, etc.). Otherwise it will
-- either be exactly the same as `NORMALIZED_GARAGE_DATA` or it will
-- simply have the missing records.
create table EXTRAPOLATED_PARKING_DATA (
   -- Columns.
   garageId    int not null references GARAGES(ID)
   datehour    timestamp not null,
   available   int not null,
   capacity    int not null,

   -- Constraints.
   primary key(garageId, datehour)
);

