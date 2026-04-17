-- View the table creation query for each table
SHOW CREATE TABLE Airport;
SHOW CREATE TABLE Users;
SHOW CREATE TABLE Aircraft;
SHOW CREATE TABLE Baggage;
SHOW CREATE TABLE Booking;
SHOW CREATE TABLE Countries;
SHOW CREATE TABLE Employees;
SHOW CREATE TABLE Flight;
SHOW CREATE TABLE GateAssignment;
SHOW CREATE TABLE Passenger;
SHOW CREATE TABLE Payment;
SHOW CREATE TABLE Seating;
SHOW CREATE TABLE States;
SHOW CREATE TABLE Ticket;
SHOW CREATE TABLE FlightPricing;
SHOW CREATE TABLE RecurringSchedule;
SHOW CREATE TABLE Standby;
SHOW CREATE TABLE Notification;

-- View trigger creation queries
SHOW TRIGGERS;
SHOW CREATE TRIGGER arrival_departure_insert;
SHOW CREATE TRIGGER arrival_departure_update;
SHOW CREATE TRIGGER trg_passenger_checks;
SHOW CREATE TRIGGER trg_passenger_checks_update;
