create table GARAGES (
   -- Columns.
   ID       int not null auto_increment primary key,
   Name     varchar(255) not null unique,
);

create table GARAGE_MONITOR_DATA (
   -- Columns.
   GarageID    int not null references GARAGES(ID),
   Timestamp   timestamp not null,
   Available   int not null,
   Capacity    int not null,

   -- Constraints.
   primary key(GarageID, Timestamp)
);


