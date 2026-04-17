CREATE TABLE `Baggage` (
       `baggageId` varchar(30) NOT NULL,
       `passengerId` varchar(50) NOT NULL,
       `additionalBaggage` tinyint(1) DEFAULT '0',
       `additionalFare` double DEFAULT NULL,
       `isChecked` tinyint(1) NOT NULL,
       `ticketCode` varchar(30) NOT NULL,
       PRIMARY KEY (`baggageId`),
       KEY `passengerId` (`passengerId`),
       KEY `fk_baggage_ticket` (`ticketCode`),
       CONSTRAINT `Baggage_ibfk_1` FOREIGN KEY (`passengerId`) REFERENCES `Passenger` (`passengerId`) 
           ON DELETE CASCADE ON UPDATE CASCADE,
       CONSTRAINT `fk_baggage_ticket` FOREIGN KEY (`ticketCode`) REFERENCES `Ticket` (`ticketCode`) 
           ON DELETE RESTRICT ON UPDATE CASCADE,
       CONSTRAINT `Baggage_chk_1` CHECK ((`additionalFare` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
