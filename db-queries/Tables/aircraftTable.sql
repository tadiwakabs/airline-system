CREATE TABLE `Aircraft` (
    `tailNumber` varchar(10) NOT NULL,
    `planeType` varchar(30) DEFAULT NULL,
    `numSeats` int NOT NULL,
    `manufacturerName` varchar(50) DEFAULT NULL,
    `flightRange` int NOT NULL,
    `currentAirport` char(3) NOT NULL,
    `currentFlight` int DEFAULT NULL,
    PRIMARY KEY (`tailNumber`),
    UNIQUE KEY `currentFlight` (`currentFlight`),
    KEY `fk_aircraft_airport` (`currentAirport`),
    CONSTRAINT `fk_aircraft_airport` FOREIGN KEY (`currentAirport`) REFERENCES `Airport` (`airportCode`) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT `FK_currentFlight` FOREIGN KEY (`currentFlight`) REFERENCES `Flight` (`flightNum`) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT `Aircraft_chk_1` CHECK ((`numSeats` between 50 and 140)),
    CONSTRAINT `chk_flightRange` CHECK ((`flightRange` between 9000 and 11000)),
    CONSTRAINT `chk_numSeats` CHECK ((`numSeats` between 50 and 140))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
