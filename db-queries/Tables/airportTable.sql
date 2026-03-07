CREATE TABLE `Airport` (
       `airportCode` char(3) NOT NULL,
       `airportName` varchar(100) NOT NULL,
       `city` varchar(30) NOT NULL,
       `state` char(2) DEFAULT NULL,
       `country` char(2) NOT NULL,
       `timezone` varchar(50) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
       PRIMARY KEY (`airportCode`),
       KEY `fk_airport_state` (`state`),
       KEY `fk_airport_country` (`country`),
       CONSTRAINT `fk_airport_country` FOREIGN KEY (`country`) REFERENCES `Countries` (`code`) 
           ON DELETE RESTRICT ON UPDATE CASCADE,
       CONSTRAINT `fk_airport_state` FOREIGN KEY (`state`) REFERENCES `States` (`code`) 
           ON DELETE RESTRICT ON UPDATE CASCADE,
       CONSTRAINT `chk_iata_length` CHECK ((length(`airportCode`) = 3))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
