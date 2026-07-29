-- SkillBridge Coding Practice — Chinook (compact sample subset)
-- One source of truth loaded by BOTH the browser (sql.js) and the server
-- grader (sqlite3), so a passing "Run" implies a passing "Submit".
-- Public-domain schema (lerocha/chinook-database). Swap in the full
-- chinook.sqlite later without changing any code — same table/column names.

PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS InvoiceLine;
DROP TABLE IF EXISTS Invoice;
DROP TABLE IF EXISTS Track;
DROP TABLE IF EXISTS Album;
DROP TABLE IF EXISTS Artist;
DROP TABLE IF EXISTS Genre;
DROP TABLE IF EXISTS MediaType;
DROP TABLE IF EXISTS Customer;

CREATE TABLE Genre (GenreId INTEGER PRIMARY KEY, Name TEXT);
CREATE TABLE MediaType (MediaTypeId INTEGER PRIMARY KEY, Name TEXT);
CREATE TABLE Artist (ArtistId INTEGER PRIMARY KEY, Name TEXT);
CREATE TABLE Album (AlbumId INTEGER PRIMARY KEY, Title TEXT, ArtistId INTEGER);
CREATE TABLE Track (
  TrackId INTEGER PRIMARY KEY, Name TEXT, AlbumId INTEGER, MediaTypeId INTEGER,
  GenreId INTEGER, Composer TEXT, Milliseconds INTEGER, Bytes INTEGER, UnitPrice REAL
);
CREATE TABLE Customer (
  CustomerId INTEGER PRIMARY KEY, FirstName TEXT, LastName TEXT, Country TEXT, Email TEXT
);
CREATE TABLE Invoice (
  InvoiceId INTEGER PRIMARY KEY, CustomerId INTEGER, InvoiceDate TEXT,
  BillingCountry TEXT, Total REAL
);
CREATE TABLE InvoiceLine (
  InvoiceLineId INTEGER PRIMARY KEY, InvoiceId INTEGER, TrackId INTEGER,
  UnitPrice REAL, Quantity INTEGER
);

INSERT INTO Genre (GenreId, Name) VALUES
  (1,'Rock'),(2,'Jazz'),(3,'Metal'),(4,'Pop'),(5,'Classical');

INSERT INTO MediaType (MediaTypeId, Name) VALUES
  (1,'MPEG audio file'),(2,'AAC audio file'),(3,'Protected AAC audio file');

INSERT INTO Artist (ArtistId, Name) VALUES
  (1,'Queen'),(2,'Miles Davis'),(3,'Metallica'),(4,'Adele'),(5,'Beethoven'),(6,'Nirvana');

INSERT INTO Album (AlbumId, Title, ArtistId) VALUES
  (1,'A Night at the Opera',1),
  (2,'News of the World',1),
  (3,'Kind of Blue',2),
  (4,'Master of Puppets',3),
  (5,'Ride the Lightning',3),
  (6,'25',4),
  (7,'Symphony No. 9',5),
  (8,'Nevermind',6);

INSERT INTO Track (TrackId, Name, AlbumId, MediaTypeId, GenreId, Composer, Milliseconds, Bytes, UnitPrice) VALUES
  (1,'Bohemian Rhapsody',1,1,1,'Mercury',354000,11000000,0.99),
  (2,'Love of My Life',1,1,1,'Mercury',217000,7000000,0.99),
  (3,'We Will Rock You',2,1,1,'May',122000,4000000,0.99),
  (4,'We Are the Champions',2,1,1,'Mercury',179000,6000000,0.99),
  (5,'Smells Like Teen Spirit',8,1,1,'Cobain',301000,9800000,0.99),
  (6,'Come as You Are',8,1,1,'Cobain',219000,7200000,0.99),
  (7,'So What',3,1,2,'Davis',545000,17000000,0.99),
  (8,'Blue in Green',3,1,2,'Davis',327000,10000000,0.99),
  (9,'Flamenco Sketches',3,1,2,'Davis',566000,18000000,0.99),
  (10,'Master of Puppets',4,1,3,'Hetfield',515000,16600000,1.29),
  (11,'Battery',4,1,3,'Hetfield',312000,10100000,1.29),
  (12,'Welcome Home',4,1,3,'Hetfield',397000,12800000,1.29),
  (13,'Fade to Black',5,1,3,'Hetfield',417000,13400000,1.29),
  (14,'Creeping Death',5,1,3,'Hetfield',396000,12700000,1.29),
  (15,'Hello',6,2,4,'Adkins',295000,9500000,1.29),
  (16,'When We Were Young',6,2,4,'Adkins',290000,9300000,1.29),
  (17,'Ode to Joy',7,1,5,'Beethoven',745000,24000000,0.99),
  (18,'Symphony No. 9 - I',7,1,5,'Beethoven',900000,29000000,0.99);

INSERT INTO Customer (CustomerId, FirstName, LastName, Country, Email) VALUES
  (1,'Alice','Brown','USA','alice.brown@example.com'),
  (2,'Bob','Smith','USA','bob.smith@example.com'),
  (3,'Carla','Diaz','Brazil','carla.diaz@example.com'),
  (4,'David','Wong','Canada','david.wong@example.com'),
  (5,'Erik','Larsen','Germany','erik.larsen@example.com'),
  (6,'Fatima','Noor','India','fatima.noor@example.com');

INSERT INTO Invoice (InvoiceId, CustomerId, InvoiceDate, BillingCountry, Total) VALUES
  (1,1,'2024-01-05','USA',3.96),
  (2,1,'2024-02-10','USA',2.58),
  (3,2,'2024-01-20','USA',5.16),
  (4,3,'2024-03-01','Brazil',1.98),
  (5,3,'2024-03-15','Brazil',3.87),
  (6,4,'2024-02-14','Canada',2.58),
  (7,5,'2024-04-01','Germany',1.29),
  (8,2,'2024-04-10','USA',0.99),
  (9,6,'2024-05-01','India',2.28),
  (10,1,'2024-05-20','USA',1.29);

INSERT INTO InvoiceLine (InvoiceLineId, InvoiceId, TrackId, UnitPrice, Quantity) VALUES
  (1,1,1,0.99,1),(2,1,2,0.99,1),(3,1,3,0.99,1),(4,1,4,0.99,1),
  (5,2,5,0.99,1),(6,2,6,0.99,1),
  (7,3,10,1.29,1),(8,3,11,1.29,1),(9,3,13,1.29,1),(10,3,15,1.29,1),
  (11,4,7,0.99,1),(12,4,8,0.99,1),
  (13,5,17,0.99,1),(14,5,18,0.99,1),(15,5,9,0.99,1),
  (16,6,1,0.99,1),(17,6,5,0.99,1),
  (18,7,10,1.29,1),
  (19,8,3,0.99,1),
  (20,9,15,1.29,1),(21,9,16,1.29,1),
  (22,10,12,1.29,1);
